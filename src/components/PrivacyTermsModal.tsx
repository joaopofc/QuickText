import React from 'react';
import { X, Shield, Lock, EyeOff, Database, CheckCircle, Scale, Zap, Github, Briefcase, Building2, Share2 } from 'lucide-react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  isForced?: boolean;
}

export default function PrivacyTermsModal({ isOpen, onClose, onAccept, isForced = false }: PrivacyTermsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="privacy-terms-modal-overlay"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="privacy-terms-modal-content"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-neutral-50">
          <div className="flex items-center gap-2">
            <Shield className="text-black" size={18} />
            <h2 className="font-sans font-bold text-gray-950 text-sm tracking-tight">
              Termos de Uso & Privacidade de Dados
            </h2>
          </div>
          {!isForced && (
            <button
              id="privacy-close-btn"
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors p-1 rounded-md hover:bg-gray-100"
              title="Fechar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-600 leading-relaxed font-sans scrollbar-thin">
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-mono tracking-wider uppercase">
              Garantia de Confidencialidade e Segurança
            </p>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Por que usar o Texto Padrão é 100% seguro para os dados de seus clientes?
            </h3>
            <p>
              Entendemos que textos de suporte, ouvidoria e cobrança frequentemente lidam com dados sensíveis de clientes (nomes, CPFs, e-mails, protocolos e valores). Por isso, esta plataforma foi projetada seguindo o princípio de <strong>Privacidade por Design (Privacy by Design)</strong>. A única e exclusiva requisição externa realizada por este sistema ocorre para a consulta automática de CEP, sem enviar absolutamente nenhuma outra informação.
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Key Clauses */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
              Cláusulas de Proteção e Segurança de Dados
            </h4>

            {/* Clause 1 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 shrink-0 border border-amber-100 mt-0.5">
                <Zap size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  1. Finalidade Exclusiva: Armazenamento de Modelos Padrão e Agilidade
                </h5>
                <p className="text-xs text-gray-500">
                  A plataforma destina-se estritamente ao armazenamento de modelos de textos de uso recorrente (respostas padrão, roteiros de atendimento, e-mails frequentes) visando aumentar a agilidade e a produtividade operacional. Ela não deve ser utilizada como banco de dados de logs permanentes, armazenamento permanente de relatórios sensíveis ou fins de auditoria histórica fora do contexto de preenchimento rápido.
                </p>
              </div>
            </div>

            {/* Clause 2 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0 border border-emerald-100 mt-0.5">
                <Database size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  2. Armazenamento 100% Local (Client-Side)
                </h5>
                <p className="text-xs text-gray-500">
                  Nenhum modelo de texto, variável detectada ou dado preenchido é enviado, armazenado ou transmitido para servidores externos. Tudo é salvo exclusivamente no <strong>localStorage do seu navegador</strong>. Ao limpar o cache ou fechar as abas sob anonimato, nenhuma cópia residual restará em qualquer nuvem ou servidor.
                </p>
              </div>
            </div>

            {/* Clause 3 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 border border-indigo-100 mt-0.5">
                <Lock size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  3. Única e Exclusiva Consulta de API: Busca de CEP
                </h5>
                <p className="text-xs text-gray-500">
                  A única e exclusiva consulta externa realizada pela plataforma ocorre para buscar informações de endereço a partir de um CEP digitado na variável "cep" (utilizando a API pública e segura do ViaCEP). Nenhuma informação do cliente, textos editados ou quaisquer outros dados digitados são transmitidos nessa ou em qualquer outra consulta. Todo o restante ocorre de forma 100% isolada e local na memória do seu navegador.
                </p>
              </div>
            </div>

            {/* Clause 4 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 shrink-0 border border-amber-100 mt-0.5">
                <EyeOff size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  4. Isolamento Total contra Vazamentos de Dados
                </h5>
                <p className="text-xs text-gray-500">
                  Como não há banco de dados centralizado em nuvem e nenhuma API de terceiros monitorando o fluxo de texto, a plataforma é imune a ataques de roubo de credenciais ou vazamento de banco de dados por invasão externa de redes.
                </p>
              </div>
            </div>

            {/* Clause 5 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600 shrink-0 border border-sky-100 mt-0.5">
                <CheckCircle size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  5. Conformidade Integral com a LGPD e GDPR
                </h5>
                <p className="text-xs text-gray-500">
                  A plataforma cumpre as diretrizes da Lei Geral de Proteção de Dados (LGPD) brasileira e do GDPR europeu de forma nativa. O usuário retém controle de 100% de seus dados e pode apagá-los instantaneamente a qualquer momento usando o botão de redefinição ou excluindo os registros.
                </p>
              </div>
            </div>

            {/* Clause 6 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 shrink-0 border border-rose-100 mt-0.5">
                <Scale size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  6. Segurança de Área de Transferência (Clipboard)
                </h5>
                <p className="text-xs text-gray-500">
                  Ao clicar em "Copiar" ou concluir o preenchimento, os dados são enviados diretamente para a área de transferência do seu sistema operacional. Nenhum software malicioso ou script secundário intercepta o conteúdo gerado por meio do Texto Padrão.
                </p>
              </div>
            </div>

            {/* Clause 7 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-800 shrink-0 border border-neutral-200 mt-0.5">
                <Github size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  7. Código Aberto, Transparência e Auditoria (GitHub)
                </h5>
                <p className="text-xs text-gray-500">
                  Para máxima transparência de conformidade e segurança da informação, todo o código-fonte deste projeto é aberto e está disponível publicamente para auditoria técnica no GitHub oficial: <a href="https://github.com/joaopofc/QuickText" target="_blank" rel="noopener noreferrer" className="text-black font-semibold hover:underline">https://github.com/joaopofc/QuickText.git</a>. Você ou a equipe de TI da sua empresa podem auditar o repositório para verificar a integridade da plataforma e certificar que todo o processamento de dados é 100% estrito ao lado do cliente (client-side).
                </p>
              </div>
            </div>

            {/* Clause 8 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 shrink-0 border border-blue-100 mt-0.5">
                <Briefcase size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  8. Uso Individual pelo Colaborador (No Âmbito Corporativo)
                </h5>
                <p className="text-xs text-gray-500">
                  O colaborador/operador tem total permissão para utilizar o Texto Padrão individualmente para aumentar a velocidade de suas rotinas de atendimento diário. O usuário é o único responsável pelo preenchimento correto das variáveis e por garantir que o texto final gerado respeite as políticas de tom de voz, confidencialidade de dados e regras internas definidas por sua empresa. Como o processamento ocorre 100% no navegador, o colaborador retém a custódia local de seus modelos criados.
                </p>
              </div>
            </div>

            {/* Clause 9 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600 shrink-0 border border-purple-100 mt-0.5">
                <Building2 size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  9. Uso, Recomendação e Distribuição Institucional pela Empresa (Para Equipes)
                </h5>
                <p className="text-xs text-gray-500">
                  Empresas, departamentos ou gerências de atendimento têm permissão para recomendar, homologar e adotar o Texto Padrão oficialmente como ferramenta corporativa para suas equipes. A organização tem total autonomia para utilizar a funcionalidade de backup (Importar/Exportar) para padronizar e distribuir coleções oficiais de respostas prontas para seus atendentes, garantindo consistência na qualidade operacional. A empresa reconhece que a ferramenta opera de forma local e offline, responsabilizando-se pelo teor das respostas padronizadas criadas e distribuídas internamente para seus times.
                </p>
              </div>
            </div>

            {/* Clause 10 */}
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600 shrink-0 border border-sky-100 mt-0.5">
                <Share2 size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900 text-xs">
                  10. Compartilhamento, Importação e Exportação de Modelos (Base64)
                </h5>
                <p className="text-xs text-gray-500">
                  A plataforma oferece suporte nativo para o compartilhamento offline e seguro de bibliotecas de modelos de texto. O usuário pode exportar seus dados na forma de uma Chave de Sincronização codificada em Base64 para compartilhar livremente via canais internos corporativos (Slack, E-mail, Teams). Ao importar um código de backup, é possível escolher entre o modo de mesclagem (importando novos itens sem duplicar os existentes) ou de substituição total (sobrescrevendo o banco local). Toda a codificação e decodificação ocorre em tempo de execução estritamente local no navegador do usuário, impossibilitando o rastreio ou armazenamento externo dos modelos compartilhados.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Legal Disclaimer */}
          <div className="bg-neutral-50 p-4 rounded-lg border border-gray-100 text-[11px] text-gray-500 space-y-1.5 font-mono">
            <p className="font-bold text-gray-700">TERMO DE RESPONSABILIDADE:</p>
            <p>
              O Texto Padrão é uma ferramenta de produtividade estritamente local. Certifique-se de colar as informações copiadas de forma segura e nos canais oficiais apropriados definidos pela sua organização.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-50 flex items-center justify-end gap-3 shrink-0 border-t border-gray-100">
          <button
            id="privacy-accept-btn"
            onClick={isForced && onAccept ? onAccept : onClose}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            {isForced ? 'Aceitar e Continuar' : 'Entendido e De Acordo'}
          </button>
        </div>
      </div>
    </div>
  );
}
