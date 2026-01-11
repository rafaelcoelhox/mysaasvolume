import { AppBenchmark, AppFeature } from '../../common/interfaces/app-type.interface';

/**
 * Base de benchmarks curada com dados de diferentes tipos de aplicação.
 * Fontes: S-1 filings, relatórios OpenView/ChartMogul, dados públicos de empresas.
 */
export const APP_BENCHMARKS: AppBenchmark[] = [
  {
    category: 'content-platform',
    name: 'Plataforma de Conteúdo',
    description: 'Blogs, portais de notícias, plataformas de artigos (Medium, Dev.to, StackOverflow)',

    readWriteRatio: 0.85,
    dauMauRatio: 0.25,
    peakMultiplier: 3,

    avgRequestsPerDAU: 45,
    avgSessionDuration: 8,
    avgSessionsPerDay: 1.5,
    avgPageViewsPerSession: 6,

    avgPageSize: 150,
    storagePerUser: 0.5,
    storagePerContentItem: 0.05,
    avgContentItemsPerUser: 3,

    typicalFeatures: ['auth', 'rich-text-editor', 'comments', 'search', 'notifications', 'bookmarks'],
    realWorldExamples: ['Medium', 'Dev.to', 'Hashnode', 'Substack'],
    dataSource: 'Análise de S-1 Medium, dados públicos Dev.to',
  },
  {
    category: 'marketplace',
    name: 'Marketplace',
    description: 'Plataformas de compra/venda, aluguel, serviços (Airbnb, MercadoLivre, Uber)',

    readWriteRatio: 0.70,
    dauMauRatio: 0.15,
    peakMultiplier: 5,

    avgRequestsPerDAU: 120,
    avgSessionDuration: 12,
    avgSessionsPerDay: 2,
    avgPageViewsPerSession: 15,

    avgPageSize: 300,
    storagePerUser: 5,
    storagePerContentItem: 2,
    avgContentItemsPerUser: 5,

    typicalFeatures: ['auth', 'search', 'geo-location', 'payments', 'reviews', 'chat', 'notifications', 'media-upload'],
    realWorldExamples: ['Airbnb', 'MercadoLivre', 'OLX', 'GetNinjas'],
    dataSource: 'S-1 Airbnb, relatórios Marketplace Pulse',
  },
  {
    category: 'saas-b2b',
    name: 'SaaS B2B',
    description: 'Ferramentas de produtividade, colaboração, gestão (Notion, Slack, Asana)',

    readWriteRatio: 0.60,
    dauMauRatio: 0.60,
    peakMultiplier: 2,

    avgRequestsPerDAU: 200,
    avgSessionDuration: 45,
    avgSessionsPerDay: 3,
    avgPageViewsPerSession: 25,

    avgPageSize: 200,
    storagePerUser: 50,
    storagePerContentItem: 0.5,
    avgContentItemsPerUser: 100,

    typicalFeatures: ['auth', 'workspaces', 'collaboration', 'real-time', 'rich-text-editor', 'file-upload', 'integrations', 'api'],
    realWorldExamples: ['Notion', 'Slack', 'Asana', 'Linear', 'Figma'],
    dataSource: 'S-1 Asana/Slack, OpenView SaaS Benchmarks 2024',
  },
  {
    category: 'saas-b2c',
    name: 'SaaS B2C',
    description: 'Apps de produtividade pessoal, finanças, saúde (Todoist, YNAB, Headspace)',

    readWriteRatio: 0.65,
    dauMauRatio: 0.35,
    peakMultiplier: 2.5,

    avgRequestsPerDAU: 80,
    avgSessionDuration: 15,
    avgSessionsPerDay: 2,
    avgPageViewsPerSession: 10,

    avgPageSize: 120,
    storagePerUser: 10,
    storagePerContentItem: 0.1,
    avgContentItemsPerUser: 50,

    typicalFeatures: ['auth', 'sync', 'offline', 'push-notifications', 'reminders', 'analytics'],
    realWorldExamples: ['Todoist', 'YNAB', 'Headspace', 'Duolingo'],
    dataSource: 'Relatórios ChartMogul, dados públicos',
  },
  {
    category: 'e-commerce',
    name: 'E-commerce',
    description: 'Lojas virtuais, D2C, varejo online',

    readWriteRatio: 0.90,
    dauMauRatio: 0.10,
    peakMultiplier: 10, // Black Friday, promoções

    avgRequestsPerDAU: 60,
    avgSessionDuration: 8,
    avgSessionsPerDay: 1.2,
    avgPageViewsPerSession: 12,

    avgPageSize: 400, // muitas imagens
    storagePerUser: 1,
    storagePerContentItem: 3, // produtos com múltiplas fotos
    avgContentItemsPerUser: 0, // usuários não criam conteúdo

    typicalFeatures: ['auth', 'search', 'cart', 'payments', 'inventory', 'shipping', 'reviews', 'recommendations'],
    realWorldExamples: ['Shopify stores', 'VTEX', 'Magento'],
    dataSource: 'Shopify Partner benchmarks, NRF data',
  },
  {
    category: 'social-network',
    name: 'Rede Social',
    description: 'Plataformas sociais, comunidades, fóruns',

    readWriteRatio: 0.75,
    dauMauRatio: 0.50,
    peakMultiplier: 3,

    avgRequestsPerDAU: 150,
    avgSessionDuration: 25,
    avgSessionsPerDay: 5,
    avgPageViewsPerSession: 20,

    avgPageSize: 250,
    storagePerUser: 20, // fotos, posts
    storagePerContentItem: 0.3,
    avgContentItemsPerUser: 50,

    typicalFeatures: ['auth', 'feed', 'posts', 'media-upload', 'likes', 'comments', 'follow', 'notifications', 'chat', 'stories'],
    realWorldExamples: ['Instagram', 'Twitter/X', 'Discord', 'Reddit'],
    dataSource: 'Meta S-1 histórico, Twitter S-1',
  },
  {
    category: 'fintech',
    name: 'Fintech',
    description: 'Apps de pagamento, banking, investimentos',

    readWriteRatio: 0.70,
    dauMauRatio: 0.40,
    peakMultiplier: 4,

    avgRequestsPerDAU: 50,
    avgSessionDuration: 5,
    avgSessionsPerDay: 2,
    avgPageViewsPerSession: 8,

    avgPageSize: 80, // leve, foco em dados
    storagePerUser: 2,
    storagePerContentItem: 0.01, // transações
    avgContentItemsPerUser: 200,

    typicalFeatures: ['auth', 'kyc', '2fa', 'payments', 'transfers', 'balance', 'statements', 'notifications', 'security'],
    realWorldExamples: ['Nubank', 'PicPay', 'Stripe Dashboard', 'Wise'],
    dataSource: 'Nubank S-1, relatórios CB Insights Fintech',
  },
  {
    category: 'edtech',
    name: 'EdTech',
    description: 'Plataformas de ensino, cursos, LMS',

    readWriteRatio: 0.80,
    dauMauRatio: 0.30,
    peakMultiplier: 3,

    avgRequestsPerDAU: 100,
    avgSessionDuration: 30,
    avgSessionsPerDay: 1.5,
    avgPageViewsPerSession: 15,

    avgPageSize: 500, // vídeos, materiais
    storagePerUser: 5,
    storagePerContentItem: 50, // vídeos são pesados
    avgContentItemsPerUser: 2,

    typicalFeatures: ['auth', 'video-streaming', 'progress-tracking', 'quizzes', 'certificates', 'forums', 'live-classes'],
    realWorldExamples: ['Coursera', 'Udemy', 'Hotmart', 'Alura'],
    dataSource: 'Coursera S-1, Udemy S-1',
  },
  {
    category: 'healthtech',
    name: 'HealthTech',
    description: 'Apps de saúde, telemedicina, fitness',

    readWriteRatio: 0.65,
    dauMauRatio: 0.35,
    peakMultiplier: 2,

    avgRequestsPerDAU: 40,
    avgSessionDuration: 10,
    avgSessionsPerDay: 1.5,
    avgPageViewsPerSession: 8,

    avgPageSize: 150,
    storagePerUser: 15, // histórico médico, exames
    storagePerContentItem: 2,
    avgContentItemsPerUser: 20,

    typicalFeatures: ['auth', 'hipaa-compliance', 'appointments', 'video-calls', 'medical-records', 'prescriptions', 'reminders'],
    realWorldExamples: ['Teladoc', 'Doctolib', 'Conexa Saúde'],
    dataSource: 'Teladoc S-1, relatórios Rock Health',
  },
  {
    category: 'developer-tools',
    name: 'Developer Tools',
    description: 'Ferramentas para desenvolvedores, APIs, infra',

    readWriteRatio: 0.50,
    dauMauRatio: 0.55,
    peakMultiplier: 2,

    avgRequestsPerDAU: 500, // APIs são chamadas frequentemente
    avgSessionDuration: 60,
    avgSessionsPerDay: 4,
    avgPageViewsPerSession: 30,

    avgPageSize: 50, // respostas JSON leves
    storagePerUser: 100, // logs, builds, artifacts
    storagePerContentItem: 5,
    avgContentItemsPerUser: 50,

    typicalFeatures: ['auth', 'api-keys', 'webhooks', 'logs', 'analytics', 'cli', 'sdks', 'documentation'],
    realWorldExamples: ['Vercel', 'Supabase', 'PlanetScale', 'Railway'],
    dataSource: 'Análise de uso Vercel, Supabase docs',
  },
];

/**
 * Features que podem ser adicionadas a qualquer tipo de app
 */
export const APP_FEATURES: AppFeature[] = [
  {
    id: 'auth',
    name: 'Autenticação',
    description: 'Login, registro, recuperação de senha',
    impactOnRequests: 1.1,
    impactOnStorage: 1.05,
    impactOnBandwidth: 1.0,
  },
  {
    id: 'real-time',
    name: 'Real-time',
    description: 'WebSockets, atualizações em tempo real',
    impactOnRequests: 2.0,
    impactOnStorage: 1.1,
    impactOnBandwidth: 1.5,
    requiresRealtime: true,
  },
  {
    id: 'media-upload',
    name: 'Upload de Mídia',
    description: 'Upload de imagens, vídeos, arquivos',
    impactOnRequests: 1.2,
    impactOnStorage: 3.0,
    impactOnBandwidth: 2.5,
    requiresMediaUpload: true,
  },
  {
    id: 'search',
    name: 'Busca',
    description: 'Busca full-text, filtros',
    impactOnRequests: 1.3,
    impactOnStorage: 1.2,
    impactOnBandwidth: 1.1,
  },
  {
    id: 'notifications',
    name: 'Notificações',
    description: 'Push, email, in-app',
    impactOnRequests: 1.15,
    impactOnStorage: 1.1,
    impactOnBandwidth: 1.05,
  },
  {
    id: 'chat',
    name: 'Chat/Mensagens',
    description: 'Mensagens entre usuários',
    impactOnRequests: 1.5,
    impactOnStorage: 1.3,
    impactOnBandwidth: 1.2,
    requiresRealtime: true,
  },
  {
    id: 'payments',
    name: 'Pagamentos',
    description: 'Integração com gateways de pagamento',
    impactOnRequests: 1.1,
    impactOnStorage: 1.1,
    impactOnBandwidth: 1.0,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Tracking de eventos, dashboards',
    impactOnRequests: 1.2,
    impactOnStorage: 1.5,
    impactOnBandwidth: 1.1,
  },
  {
    id: 'video-streaming',
    name: 'Streaming de Vídeo',
    description: 'Player de vídeo, HLS/DASH',
    impactOnRequests: 1.3,
    impactOnStorage: 5.0,
    impactOnBandwidth: 10.0,
    requiresMediaUpload: true,
  },
  {
    id: 'geo-location',
    name: 'Geolocalização',
    description: 'Mapas, busca por proximidade',
    impactOnRequests: 1.2,
    impactOnStorage: 1.1,
    impactOnBandwidth: 1.3,
  },
  {
    id: 'api',
    name: 'API Pública',
    description: 'API para integrações externas',
    impactOnRequests: 1.5,
    impactOnStorage: 1.2,
    impactOnBandwidth: 1.3,
  },
  {
    id: 'collaboration',
    name: 'Colaboração',
    description: 'Edição colaborativa, workspaces',
    impactOnRequests: 1.8,
    impactOnStorage: 1.3,
    impactOnBandwidth: 1.4,
    requiresRealtime: true,
  },
];

/**
 * Multiplicadores regionais para ajustar estimativas
 */
export const REGION_MULTIPLIERS = {
  brazil: {
    peakHours: { start: 19, end: 23 }, // horário de pico
    timezone: 'America/Sao_Paulo',
    bandwidthCostMultiplier: 1.2, // mais caro que US
    latencyRequirement: 'medium',
  },
  latam: {
    peakHours: { start: 19, end: 23 },
    timezone: 'America/Sao_Paulo',
    bandwidthCostMultiplier: 1.3,
    latencyRequirement: 'medium',
  },
  us: {
    peakHours: { start: 18, end: 22 },
    timezone: 'America/New_York',
    bandwidthCostMultiplier: 1.0,
    latencyRequirement: 'low',
  },
  europe: {
    peakHours: { start: 19, end: 23 },
    timezone: 'Europe/London',
    bandwidthCostMultiplier: 1.1,
    latencyRequirement: 'low',
  },
  global: {
    peakHours: { start: 0, end: 24 }, // sempre tem pico em algum lugar
    timezone: 'UTC',
    bandwidthCostMultiplier: 1.0,
    latencyRequirement: 'high', // precisa de CDN/edge
  },
};
