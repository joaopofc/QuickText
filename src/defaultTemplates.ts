import { Template } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    title: 'Agradecimento de Compra',
    content: 'Olá, {{nome}}!\n\nAgradecemos imensamente pela sua compra do {{produto}}!\nO seu pedido já está sendo processado e o código de rastreio será enviado para o seu e-mail em breve.\n\nSe tiver qualquer dúvida, fique à vontade para responder a este e-mail.\n\nAtenciosamente,\n{{seu_nome}} | Equipe de Suporte',
    category: 'Suporte',
    usageCount: 12,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl-2',
    title: 'Suporte Técnico - Reset de Senha',
    content: 'Olá, {{nome}}.\n\nRecebemos uma solicitação para redefinir a senha da sua conta associada ao e-mail {{email}}.\n\nPara cadastrar uma nova senha, clique no link de segurança abaixo:\n{{link_seguranca}}\n\nSe você não solicitou esta redefinição, pode ignorar este e-mail com segurança. Sua senha atual continuará funcionando.\n\nAtenciosamente,\nSuporte Técnico',
    category: 'Suporte',
    usageCount: 24,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl-3',
    title: 'Follow-up de Proposta Comercial',
    content: 'Olá, {{nome}}!\n\nEspero que esteja tudo bem.\n\nEstou passando para saber se você teve oportunidade de analisar a proposta comercial que enviamos para a {{empresa}} na semana passada.\n\nEstamos muito entusiasmados com a parceria e prontos para começar. Você teria 15 minutos livre nesta {{dia_da_semana}} para tirarmos dúvidas e definirmos os próximos passos?\n\nUm abraço,\n{{seu_nome}}',
    category: 'Comercial',
    usageCount: 8,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl-4',
    title: 'Assinatura Profissional',
    content: 'Atenciosamente,\n\n{{seu_nome}}\n{{cargo}} | {{departamento}}\nCelular: {{telefone}}\nE-mail: {{seu_email}}',
    category: 'Pessoal',
    usageCount: 35,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl-5',
    title: 'Mensagem de Ausência (Férias)',
    content: 'Olá,\n\nAgradeço seu contato!\nNo momento estou ausente devido a período de férias, com retorno previsto para o dia {{data_retorno}}.\n\nPara assuntos urgentes, por favor entre em contato com {{nome_contato}} no e-mail {{email_contato}}.\n\nAtenciosamente,\n{{seu_nome}}',
    category: 'Produtividade',
    usageCount: 3,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl-6',
    title: 'Reclamação de Cliente (Ouvidoria)',
    content: 'Prezado(a) {{nome_do_cliente}},\n\nAgradecemos por nos relatar sua experiência. Registramos a sua manifestação sob o protocolo #{{protocolo}}.\n\nAnalisamos detalhadamente o ocorrido:\n[[detalhes_da_reclamacao]]\n\nNossa equipe de qualidade já está atuando para solucionar este caso e entrará em contato em breve.\n\nAtenciosamente,\n{{seu_nome}}\nDepartamento de Resolução de Conflitos',
    category: 'Suporte',
    usageCount: 15,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    variablePresets: {
      'detalhes_da_reclamacao': [
        'Texto de reclamação por problemas de IOF cobrado incorretamente em transação internacional.',
        'Texto de reclamação por problemas de vencimento de fatura gerada com data errada.'
      ]
    }
  }
];

export const AVAILABLE_CATEGORIES = [
  'Suporte',
  'Comercial',
  'Pessoal',
  'Produtividade',
  'Outros'
];
