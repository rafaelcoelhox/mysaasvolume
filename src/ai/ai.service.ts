import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppCategory } from '../common/interfaces/app-type.interface';
import { APP_BENCHMARKS, APP_FEATURES } from '../benchmarks/data/benchmarks.data';

export interface AIAnalysisResult {
  appType: AppCategory;
  confidence: number;
  detectedFeatures: string[];
  suggestedFeatures: string[];
  extractedInfo: {
    targetAudience?: string;
    vertical?: string;
    similarApps?: string[];
    keyDifferentiator?: string;
  };
  reasoning: string;
}

export interface AIEstimateEnhancement {
  insights: string[];
  risks: string[];
  recommendations: string[];
  scalingConsiderations: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // API Key do Gemini
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDoSB745Y-uFkYzZoCmoaNrOyLN8jqZBlo';

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Verifica se a API do Gemini está configurada
   */
  isConfigured(): boolean {
    return !!this.model;
  }

  /**
   * Analisa a descrição do projeto e extrai informações estruturadas
   */
  async analyzeProjectDescription(description: string): Promise<AIAnalysisResult> {
    const categoriesInfo = APP_BENCHMARKS.map((b) => ({
      id: b.category,
      name: b.name,
      description: b.description,
      examples: b.realWorldExamples,
    }));

    const featuresInfo = APP_FEATURES.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
    }));

    const prompt = `Você é um especialista em arquitetura de software e dimensionamento de sistemas.

Analise a seguinte descrição de projeto e extraia informações estruturadas:

DESCRIÇÃO DO PROJETO:
"${description}"

CATEGORIAS DISPONÍVEIS:
${JSON.stringify(categoriesInfo, null, 2)}

FEATURES DISPONÍVEIS:
${JSON.stringify(featuresInfo, null, 2)}

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem explicações, sem \`\`\`json):
{
  "appType": "categoria mais adequada (use o id)",
  "confidence": 0.0 a 1.0,
  "detectedFeatures": ["features explicitamente mencionadas ou claramente necessárias"],
  "suggestedFeatures": ["features não mencionadas mas provavelmente necessárias"],
  "extractedInfo": {
    "targetAudience": "público alvo detectado",
    "vertical": "setor/vertical de mercado",
    "similarApps": ["apps similares mencionados ou inferidos"],
    "keyDifferentiator": "diferencial mencionado"
  },
  "reasoning": "breve explicação da classificação"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Limpar possíveis marcadores de código
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse do JSON
      const parsed = JSON.parse(text);

      // Validar que o appType é válido
      const validCategories = APP_BENCHMARKS.map((b) => b.category);
      if (!validCategories.includes(parsed.appType)) {
        parsed.appType = 'saas-b2b'; // fallback
        parsed.confidence = Math.min(parsed.confidence, 0.5);
      }

      // Validar features
      const validFeatures = APP_FEATURES.map((f) => f.id);
      parsed.detectedFeatures = (parsed.detectedFeatures || []).filter((f: string) =>
        validFeatures.includes(f),
      );
      parsed.suggestedFeatures = (parsed.suggestedFeatures || []).filter((f: string) =>
        validFeatures.includes(f),
      );

      return parsed as AIAnalysisResult;
    } catch (error) {
      this.logger.error('Erro ao analisar com Gemini:', error);
      return this.fallbackAnalysis(description);
    }
  }

  /**
   * Gera insights adicionais sobre as estimativas
   */
  async enhanceEstimate(
    description: string,
    appType: AppCategory,
    estimatedMAU: number,
  ): Promise<AIEstimateEnhancement> {
    const benchmark = APP_BENCHMARKS.find((b) => b.category === appType);

    const prompt = `Você é um especialista em arquitetura de software e scaling de sistemas.

PROJETO:
"${description}"

TIPO DETECTADO: ${appType} (${benchmark?.name})
USUÁRIOS ESTIMADOS (MAU): ${estimatedMAU.toLocaleString()}

Baseado nessas informações, forneça insights práticos.

Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):
{
  "insights": ["3-5 insights sobre o dimensionamento"],
  "risks": ["2-3 riscos técnicos a considerar"],
  "recommendations": ["3-5 recomendações de arquitetura"],
  "scalingConsiderations": ["2-3 pontos sobre scaling futuro"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Limpar possíveis marcadores de código
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return JSON.parse(text) as AIEstimateEnhancement;
    } catch (error) {
      this.logger.error('Erro ao gerar insights:', error);
      return this.fallbackEnhancement(appType);
    }
  }

  /**
   * Análise básica sem IA (fallback)
   */
  private fallbackAnalysis(description: string): AIAnalysisResult {
    const descLower = description.toLowerCase();

    // Detecção básica por keywords
    let appType: AppCategory = 'saas-b2b';
    let confidence = 0.5;

    const keywordMap: Record<string, { category: AppCategory; boost: number }[]> = {
      marketplace: [{ category: 'marketplace', boost: 0.3 }],
      airbnb: [{ category: 'marketplace', boost: 0.3 }],
      uber: [{ category: 'marketplace', boost: 0.3 }],
      'e-commerce': [{ category: 'e-commerce', boost: 0.3 }],
      loja: [{ category: 'e-commerce', boost: 0.2 }],
      blog: [{ category: 'content-platform', boost: 0.3 }],
      medium: [{ category: 'content-platform', boost: 0.3 }],
      artigos: [{ category: 'content-platform', boost: 0.2 }],
      'rede social': [{ category: 'social-network', boost: 0.3 }],
      instagram: [{ category: 'social-network', boost: 0.3 }],
      fintech: [{ category: 'fintech', boost: 0.3 }],
      banco: [{ category: 'fintech', boost: 0.2 }],
      pagamento: [{ category: 'fintech', boost: 0.2 }],
      curso: [{ category: 'edtech', boost: 0.3 }],
      educação: [{ category: 'edtech', boost: 0.2 }],
      saúde: [{ category: 'healthtech', boost: 0.2 }],
      telemedicina: [{ category: 'healthtech', boost: 0.3 }],
      notion: [{ category: 'saas-b2b', boost: 0.3 }],
      slack: [{ category: 'saas-b2b', boost: 0.3 }],
      produtividade: [{ category: 'saas-b2b', boost: 0.2 }],
      api: [{ category: 'developer-tools', boost: 0.2 }],
      developer: [{ category: 'developer-tools', boost: 0.3 }],
    };

    const scores: Record<AppCategory, number> = {} as Record<AppCategory, number>;
    APP_BENCHMARKS.forEach((b) => (scores[b.category] = 0));

    Object.entries(keywordMap).forEach(([keyword, matches]) => {
      if (descLower.includes(keyword)) {
        matches.forEach((m) => {
          scores[m.category] += m.boost;
        });
      }
    });

    const bestMatch = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (bestMatch[1] > 0) {
      appType = bestMatch[0] as AppCategory;
      confidence = Math.min(0.7, 0.5 + bestMatch[1]);
    }

    // Detectar features básicas
    const detectedFeatures: string[] = ['auth'];

    if (descLower.includes('upload') || descLower.includes('imagem') || descLower.includes('foto')) {
      detectedFeatures.push('media-upload');
    }
    if (descLower.includes('real-time') || descLower.includes('tempo real') || descLower.includes('colabora')) {
      detectedFeatures.push('real-time');
    }
    if (descLower.includes('busca') || descLower.includes('search') || descLower.includes('filtro')) {
      detectedFeatures.push('search');
    }
    if (descLower.includes('chat') || descLower.includes('mensag')) {
      detectedFeatures.push('chat');
    }
    if (descLower.includes('pagamento') || descLower.includes('payment') || descLower.includes('stripe')) {
      detectedFeatures.push('payments');
    }
    if (descLower.includes('notifica')) {
      detectedFeatures.push('notifications');
    }

    return {
      appType,
      confidence,
      detectedFeatures,
      suggestedFeatures: [],
      extractedInfo: {},
      reasoning: 'Análise básica por keywords (fallback)',
    };
  }

  /**
   * Enhancement básico sem IA
   */
  private fallbackEnhancement(appType: AppCategory): AIEstimateEnhancement {
    const benchmark = APP_BENCHMARKS.find((b) => b.category === appType);

    return {
      insights: [
        `Apps do tipo ${benchmark?.name || appType} tipicamente têm ${Math.round((benchmark?.readWriteRatio || 0.7) * 100)}% de reads`,
        `O ratio DAU/MAU médio é ${Math.round((benchmark?.dauMauRatio || 0.3) * 100)}%`,
        'Considere implementar caching agressivo para reduzir carga no banco',
      ],
      risks: [
        'Picos de tráfego podem ser maiores que o estimado em eventos especiais',
        'Crescimento de storage pode acelerar com aumento de engagement',
      ],
      recommendations: [
        'Implemente caching com Redis/Valkey para queries frequentes',
        'Use CDN para assets estáticos e mídia',
        'Configure auto-scaling desde o início',
      ],
      scalingConsiderations: [
        'Planeje sharding de banco acima de 100GB',
        'Considere arquitetura de microserviços acima de 10k req/s',
      ],
    };
  }
}
