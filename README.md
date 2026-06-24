# ⚡ QuickText

> **Aumente a sua agilidade operacional com modelos de texto inteligentes e preenchimento dinâmico instantâneo — 100% local, seguro e focado em privacidade.**

O **QuickText** é uma plataforma minimalista de alto desempenho projetada para profissionais de atendimento, vendas, ouvidoria, suporte e cobrança. Ele centraliza todos os seus modelos de texto recorrentes (respostas padrão, roteiros, e-mails frequentes) e permite preenchê-los com variáveis personalizadas de forma ultrarrápida.

---

## ✨ Recursos Principais

### 🏃‍♂️ Foco Extremo em Agilidade
* **Foco Instantâneo de Busca**: Basta começar a digitar em qualquer lugar da tela (mesmo fora do campo de busca) para abrir o painel de pesquisa e começar a filtrar seus templates automaticamente.
* **Abertura Inteligente (Enter)**: Ao pesquisar, se houver apenas um único template correspondente aos critérios, basta pressionar **`Enter`** para abri-lo e preenchê-lo imediatamente.
* **Preenchimento com Teclado**: Atalhos e transições rápidas mantêm suas mãos no teclado para copiar textos em segundos.

### 🧩 Motor Dinâmico de Variáveis
* **Variáveis Simples `{{campo}}`**: Identifica campos curtos para digitação direta em linha (como nome, protocolo ou data).
* **Variáveis de Área de Texto `[[campo]]`**: Detecta e gera caixas expandidas apropriadas para textos multilíngues, descrições detalhadas ou observações longas.
* **Valores Predefinidos (Presets)**: Salve valores recorrentes para suas variáveis (como links de pagamento específicos, assinaturas de operadores, preços padrão) e insira-os com apenas um clique nos formulários.

### 🔒 Segurança Absoluta (Privacy-by-Design)
* **Processamento 100% Client-Side**: Nenhuma linha de texto, variável ou dado de cliente é enviado para servidores externos.
* **Armazenamento Local**: Seus templates e configurações são armazenados de forma segura e exclusiva no `localStorage` do seu próprio navegador.
* **Livre de Rastreamento**: Sem cookies de terceiros, sem telemetria secreta, sem logs e totalmente compatível com as diretrizes da **LGPD** e **GDPR**.
* **Isolamento de Redes**: Imune a vazamentos de dados na nuvem, uma vez que não há infraestrutura de backend centralizada para armazenar dados sensíveis de clientes.

---

## 🛠️ Tecnologias Utilizadas

* **React 19 & TypeScript**: Interface robusta e tipagem estática segura.
* **Vite**: Construção e carregamento instantâneos do servidor de desenvolvimento.
* **Tailwind CSS v4**: Design sofisticado, com transições suaves, tipografia de alto padrão e visual limpo (Space Grotesk & Inter).
* **Lucide React**: Conjunto de ícones vetoriais modernos e consistentes.
* **Motion**: Animações de interface ricas e polidas para transições de modais e menus.

---

## 🚀 Como Executar Localmente

Certifique-se de ter o [Node.js](https://nodejs.org) instalado em sua máquina.

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/seu-usuario/QuickText.git
   cd QuickText
   ```

2. **Instalar as Dependências**:
   ```bash
   npm install
   ```

3. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   *O projeto estará disponível por padrão no endereço `http://localhost:3000`.*

4. **Gerar Versão de Produção (Build)**:
   ```bash
   npm run build
   ```

---

## ☁️ Como Rodar no Vercel

O QuickText foi configurado especificamente para rodar na nuvem do **Vercel** de forma simples, sem necessidade de servidores complexos por ser uma Single Page Application (SPA).

1. **Preparar o Repositório**:
   Crie um repositório no seu GitHub/GitLab com o código atual do projeto.

2. **Conectar ao Vercel**:
   * Vá para o painel do [Vercel](https://vercel.com) e clique em **"Add New"** > **"Project"**.
   * Importe o seu repositório do **QuickText**.

3. **Configurações do Projeto**:
   * **Framework Preset**: O Vercel detectará automaticamente o **Vite** como framework padrão.
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`

4. **Publicar**:
   Clique em **"Deploy"**. O Vercel fará o build da aplicação em segundos e gerará um link público de alta velocidade de carregamento protegido por HTTPS.

> *Nota: O arquivo `vercel.json` incluído na raiz gerencia automaticamente as rotas para garantir que as atualizações de página direcionem corretamente para o index.html principal, prevenindo erros 404 de SPA.*

---

## 📄 Termos de Uso e Privacidade

O QuickText conta com um painel dedicado e transparente de **Termos e Privacidade** acessível diretamente no rodapé da aplicação, especificando todas as diretrizes de proteção aos dados dos clientes tratados na ferramenta de forma clara para auditores de segurança e TI.
