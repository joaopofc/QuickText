# ⚡ Texto Padrão (QuickText)

> **Aumente a sua agilidade operacional com modelos de texto inteligentes, preenchimento dinâmico e privacidade garantida — 100% local, seguro e focado em produtividade.**

O **Texto Padrão (QuickText)** é um assistente minimalista de alta performance projetado para profissionais de atendimento, suporte, vendas, ouvidoria e cobrança. Ele centraliza roteiros, respostas padrão e comunicações recorrentes, permitindo que você preencha campos dinâmicos instantaneamente usando o teclado ou cliques rápidos, sem quebrar o fluxo de digitação.

---

## 🚀 Novidades e Recursos Recentes

Esta versão traz melhorias profundas de usabilidade, inteligência e refinamento visual baseadas em solicitações de otimização operacional real:

### 🧩 Fluxo de Texto Contínuo e Alinhamento Preciso
* **Texto Fluido Inline**: As variáveis preenchidas agora se comportam como elementos `inline` puros no fluxo de visualização. Elas quebram de linha naturalmente e se ajustam de forma contínua com o restante do texto.
* **Consistência de Peso (Weight)**: O texto padrão e os valores preenchidos utilizam o mesmo peso tipográfico (`font-semibold`), garantindo um visual limpo, profissional e coeso.
* **Placeholder Inteligente**: Variáveis não preenchidas aparecem como blocos mono destacados em tom âmbar com efeito de pulsação suave (`{{campo}}` ou `[[campo]]`), tornando nítido o que ainda precisa ser preenchido.

### 🔍 Busca Automatizada e Inteligente de CEP (Sem Atrito)
* **Preenchimento Automático via ViaCEP**: Ao digitar ou colar qualquer padrão de CEP (`44444-444`, `44.444-444` ou apenas `44444444`), o sistema limpa caracteres não-numéricos, formata no padrão `XXXXX-XXX` e executa a consulta automaticamente assim que alcança os 8 dígitos, eliminando botões redundantes.
* **Segurança e Privacidade Absoluta**: A busca de CEP é a **única e exclusiva consulta a APIs externas** feita pela aplicação. Nenhuma outra informação pessoal ou dados do cliente é transmitida para fora do seu navegador.
* **Anti-Atrito de Interface**: Durante a busca de CEP (que dura 2 segundos no máximo), o campo de digitação fica desabilitado para evitar concorrências ou digitações incorretas.
* **Feedback "Pronto"**: Ao preencher com sucesso, o sistema exibe apenas um indicador discreto de **"Pronto"**, removendo alertas intrusivos ou banners poluídos.

### 📐 Ergonomia Visual e Controle de Fonte
* **Controle de Escala de Fonte**: Adicionamos seletores táteis de **-** e **+** logo abaixo da caixa de visualização do texto. Agora, você ajusta o tamanho do texto final para o conforto ideal da sua tela com apenas um clique.
* **Inicialização Inteligente**: O assistente inicia diretamente no **modo de tela normal** (não-flutuante), oferecendo uma experiência focada na tela de preenchimento. Caso prefira trabalhar com multi-tarefas, você pode ativar o **Modo Flutuante** (Picture-in-Picture) com um único clique.
* **Interface Limpa (Zero-Slop)**: Removemos títulos desnecessários como *"Sugestões rápidas:"* para maximizar a área útil dos inputs. Agora, os valores de sugestão (presets) flutuam elegantemente logo abaixo do campo.

### 🐛 Correções de Bugs Cruciais
* **Status Preciso de Preenchimento**: Corrigido o bug onde apagar todo o conteúdo de um campo o mantinha marcado como *"Preenchido"*. O sistema agora limpa totalmente o estado do input e redefine o status imediatamente para **"Pendente"** quando o campo é esvaziado.
* **Comportamento Robusto ao Copiar**: Corrigido o bug que fechava o assistente ao copiar textos fora do modo flutuante (PiP). Agora, o modal permanece aberto e exibe uma confirmação silenciosa e amigável de cópia bem-sucedida.

---

## ✨ Recursos Clássicos e Estrutura

### 🏃‍♂️ Foco Extremo em Velocidade de Trabalho
* **Busca Global Instantânea**: Comece a digitar em qualquer lugar da tela e o filtro de templates se ativará automaticamente.
* **Atalho Enter Inteligente**: Se houver apenas um template correspondente na sua pesquisa, pressione **`Enter`** para abrir o formulário imediatamente.
* **Navegação Inteligente**: Pressione **`Tab`** para avançar entre variáveis, ou dê um duplo clique em qualquer lugar para copiar o texto pronto instantaneamente.

### 🔒 Privacy-by-Design (LGPD & GDPR Compliant)
* **Processamento Local**: Todos os templates, variáveis e dados são processados inteiramente no lado do cliente (`localStorage`). Sem rastreadores, cookies de terceiros, telemetria ou armazenamento em nuvem externa de terceiros.

---

## 🛠️ Tecnologias Utilizadas

* **React 19 & TypeScript**: Código escalável, rápido e com tipagem estática rigorosa.
* **Vite**: Hot Module Replacement (HMR) e compilação ultraveloz.
* **Tailwind CSS v4**: Design sofisticado com paleta de cores balanceada, transições suaves e tipografia moderna.
* **Lucide React**: Biblioteca de ícones vetoriais modernos.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org) (versão 18+) instalado.

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/joaopofc/QuickText.git
   cd QuickText
   ```

2. **Instalar Dependências**:
   ```bash
   npm install
   ```

3. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   *O projeto iniciará por padrão em `http://localhost:3000`.*

4. **Gerar Build de Produção**:
   ```bash
   npm run build
   ```

---

## 📂 Verificação da Estrutura do Projeto

Abaixo está listada a estrutura de arquivos chave para facilitar a auditoria técnica e verificação de integridade do código:

```text
QuickText/
├── src/
│   ├── components/
│   │   ├── QuickFillModal.tsx   # Componente central (Modal, Form, PiP e Live Preview)
│   │   ├── SettingsModal.tsx    # Modal de configurações da aplicação
│   │   ├── TemplateCard.tsx     # Cartões individuais de visualização de templates
│   │   └── TemplateForm.tsx     # Gerenciamento de criação/edição de novos templates
│   ├── defaultTemplates.ts      # Banco de dados inicial de templates de suporte/ouvidoria
│   ├── App.tsx                  # Ponto de entrada da UI e orquestrador de estado global
│   ├── index.css                # Estilização global e variáveis Tailwind CSS
│   └── main.tsx                 # Inicializador do React 19
├── index.html                   # Estrutura HTML estática principal da aplicação
├── package.json                 # Manifesto de dependências e scripts npm
├── vite.config.ts               # Arquivo de configuração de empacotamento Vite
└── vercel.json                  # Regras de redirecionamento para deploy SPA na Vercel
```

---

## 📑 Termos de Uso e Privacidade

O sistema inclui um painel robusto e transparente sobre seus termos de privacidade diretamente no rodapé da página. Isso garante que sua empresa ou equipe estejam em total conformidade regulatória sobre dados pessoais.
