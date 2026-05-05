// ============================================================================
// CURSOS PADRÃO COM SUAS MATÉRIAS OBRIGATÓRIAS
// ============================================================================

const DEFAULT_COURSES = {
  'eng-comp': {
    name: 'Engenharia da Computação',
    subjects: [
      { name: 'Cálculo I', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Álgebra Linear', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Programação I', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Geometria Analítica', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Cálculo II', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Estrutura de Dados', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Programação II', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Lógica Digital', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Cálculo III', period: '3º período', type: 'OBRIGATORIA' },
      { name: 'Banco de Dados', period: '3º período', type: 'OBRIGATORIA' },
      { name: 'Algoritmos', period: '3º período', type: 'OBRIGATORIA' },
      { name: 'Arquitetura de Computadores', period: '3º período', type: 'OBRIGATORIA' }
    ]
  },
  'sist-info': {
    name: 'Sistemas de Informação',
    subjects: [
        { name: 'Programação de Computadores I', period: '1', type: 'OBRIGATORIA' },
        { name: 'Fundamentos de Cálculo I', period: '1', type: 'OBRIGATORIA' },
        { name: 'Fundamentos de GAAL', period: '1', type: 'OBRIGATORIA' },
        { name: 'Fundamentos de SI', period: '1', type: 'OBRIGATORIA' },
        { name: 'Informática e Sociedade', period: '1', type: 'OBRIGATORIA' },
        { name: 'Metodologia de Pesquisa', period: '1', type: 'OBRIGATORIA' },

        { name: 'Programação de Computadores II', period: '2', type: 'OBRIGATORIA' },
        { name: 'Algoritmos e Estruturas de Dados I', period: '2', type: 'OBRIGATORIA' },
        { name: 'Matemática Discreta', period: '2', type: 'OBRIGATORIA' },
        { name: 'Gestão da Informação', period: '2', type: 'OBRIGATORIA' },
        { name: 'Teoria Geral da Administração', period: '2', type: 'OBRIGATORIA' },

        { name: 'Algoritmos e Estruturas de Dados II', period: '3', type: 'OBRIGATORIA' },
        { name: 'Algoritmos e Estruturas de Dados III', period: '3', type: 'OBRIGATORIA' },
        { name: 'Fundamentos de Organização de Computadores', period: '3', type: 'OBRIGATORIA' },
        { name: 'Estatística e Probabilidade', period: '3', type: 'OBRIGATORIA' },
        { name: 'Comportamento Organizacional', period: '3', type: 'OBRIGATORIA'},

        { name: 'Engenharia de Software I', period: '4', type: 'OBRIGATORIA' },
        { name: 'Banco de Dados I', period: '4', type: 'OBRIGATORIA' },
        { name: 'Sistemas Operacionais', period: '4', type: 'OBRIGATORIA' },
        { name: 'Programação Linear e Inteira', period: '4', type: 'OBRIGATORIA' },
        { name: 'Economia', period: '4', type: 'OBRIGATORIA' },

        { name: 'Engenharia de Software II', period: '5', type: 'OBRIGATORIA' },
        { name: 'Interação Humano-Computador', period: '5', type: 'OBRIGATORIA' },
        { name: 'Fundamentos Teóricos da Computação', period: '5', type: 'OBRIGATORIA' },
        { name: 'Redes de Computadores I', period: '5', type: 'OBRIGATORIA' },
        { name: 'Inteligência Artificial', period: '5', type: 'OBRIGATORIA' },
        { name: 'Projeto Integrador I', period: '5', type: 'OBRIGATORIA' },

        { name: 'Gerenciamento de Projetos de Software', period: '6', type: 'OBRIGATORIA' },
        { name: 'Sistemas Web I', period: '6', type: 'OBRIGATORIA' },
        { name: 'Projeto Integrador II', period: '6', type: 'OBRIGATORIA' },
        { name: 'Linguagens de Programação', period: '6', type: 'OBRIGATORIA' },
        { name: 'Sistemas Distribuídos', period: '6', type: 'OBRIGATORIA' },

        { name: 'Empreendedorismo', period: '7', type: 'OBRIGATORIA' },
        { name: 'Adm. Recursos Humanos', period: '7', type: 'OBRIGATORIA' },
        { name: 'Gestão da TI', period: '7', type: 'OBRIGATORIA' },
        
        { name: 'Segurança e Auditoria', period: '8', type: 'OBRIGATORIA' },
        { name: 'Sistemas Apoio à Decisão', period: '8', type: 'OBRIGATORIA' },

    ]
  },
  'eng-eletrica': {
    name: 'Engenharia Elétrica',
    subjects: [
        { name: 'Quimica Geral', period: '1', type: 'OBRIGATORIA' },
        { name: 'Quimica Geral Experimental', period: '1', type: 'OBRIGATORIA' },
        { name: 'Geometria Analítica e Algebra Linear', period: '1', type: 'OBRIGATORIA' },
        { name: 'Cálculo Diferencial e Integral I', period: '1º período', type: 'OBRIGATORIA'},
        { name: 'Programação de Computadores I', period: '1', type: 'OBRIGATORIA' },
        { name: 'Comunicação e Expressão', period: '1', type: 'OBRIGATORIA' },
        { name: 'Introdução à Engenharia Elétrica', period: '1', type: 'OBRIGATORIA' },
        { name: 'Metodologia da Pesquisa', period: '1', type: 'OBRIGATORIA' },

        { name: 'Cálculo Diferencial e Integral II', period: '2', type: 'OBRIGATORIA' },
        { name: 'Estatistica e Probabilidade', period: '2', type: 'OBRIGATORIA' },
        { name: 'Fisica I', period: '2', type: 'OBRIGATORIA' },
        { name: 'Algoritmos e Estruturas de Dados I', period: '2', type: 'OBRIGATORIA' },
        { name: 'Desenho Computacional', period: '2', type: 'OBRIGATORIA' },

        { name: 'Calculo Diferencial e Integral III', period: '3', type: 'OBRIGATORIA' },
        { name: 'Introdução as Esquações Diferenciais Ordinárias', period: '3', type: 'OBRIGATORIA' },
        { name: 'Física II', period: '3', type: 'OBRIGATORIA' },
        { name: 'Fisica III', period: '3', type: 'OBRIGATORIA' },
        { name: 'Principios de Eletronico Digital', period: '3', type: 'OBRIGATORIA' },

        { name: 'Metodos Matemáticos Aplicados à Engenharia', period: '4', type: 'OBRIGATORIA' },
        { name: 'Fisica IV', period: '4', type: 'OBRIGATORIA' },
        { name: 'Analise Numerica', period: '4', type: 'OBRIGATORIA' },
        { name: 'Organização e Arquitetura de Computadores I', period: '4', type: 'OBRIGATORIA' },
        { name: 'Circuitos Elétricos I', period: '4', type: 'OBRIGATORIA' },

        { name: 'Mecanica Quantica Aplicada', period: '5', type: 'OBRIGATORIA' },
        { name: 'Eletromagnetismo', period: '5', type: 'OBRIGATORIA' },
        { name: 'Modelagem e Analise de Sistemas Lineares', period: '5', type: 'OBRIGATORIA' },
        { name: 'Sinais e Sistemas', period: '5', type: 'OBRIGATORIA' },
        { name: 'Circuitos Elétricos II', period: '5', type: 'OBRIGATORIA' },

        { name: 'Maquinas Elétricas', period: '6', type: 'OBRIGATORIA' },
        { name: 'Sistemas de Controle I', period: '6', type: 'OBRIGATORIA' },
        { name: 'Eletrônica I', period: '6', type: 'OBRIGATORIA' },
        { name: 'Sistemas de Potência I', period: '6', type: 'OBRIGATORIA' },
        { name: 'Fundamentos de Comunicação', period: '6', type: 'OBRIGATORIA' },

        { name: 'Maquinas Elétricas II', period: '7', type: 'OBRIGATORIA' },
        { name: 'Eletronica II', period: '7', type: 'OBRIGATORIA' },
        { name: 'Microprocessadores e Microcontroladores', period: '7', type: 'OBRIGATORIA' },
        { name: 'Sistemas de Controle II', period: '7', type: 'OBRIGATORIA' },

        { name: 'Teoria da Administração I', period: '8', type: 'OBRIGATORIA' },
        { name: 'Eletronica Embarcada', period: '8', type: 'OBRIGATORIA' },
        { name: 'Eletronica de Potência', period: '8', type: 'OBRIGATORIA' },
        { name: 'Processamento Digital de Sinais', period: '8', type: 'OBRIGATORIA' },

        { name: 'Redes de Computadores I', period: '9', type: 'OBRIGATORIA' },
        { name: 'Filosofia e Ética', period: '9', type: 'OBRIGATORIA' },
        { name: 'Instrumentação', period: '9', type: 'OBRIGATORIA' },
        { name: 'Acionamento Eletrico', period: '9', type: 'OBRIGATORIA' },
        { name: 'Projeto em Engenharia Elétrica', period: '9', type: 'OBRIGATORIA' },
        
        { name: 'Fundamentos de Ciência do Ambiente', period: '10', type: 'OBRIGATORIA' },
        { name: 'Informatica Industrial', period: '10', type: 'OBRIGATORIA' },
        { name: 'Materiais Eletricos', period: '10', type: 'OBRIGATORIA' },
        { name: 'Projeto Integrador', period: '10', type: 'OBRIGATORIA' },
        { name: 'Instalações Elétricas', period: '10', type: 'OBRIGATORIA' },
    ]
  },
  'eng-producao': {
    name: 'Engenharia de Produção',
    subjects: [
      { name: 'Cálculo I', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Álgebra Linear', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Administração Geral', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Contabilidade Básica', period: '1º período', type: 'OBRIGATORIA' },
      { name: 'Cálculo II', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Estatística', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Gestão de Operações', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Direito Empresarial', period: '2º período', type: 'OBRIGATORIA' },
      { name: 'Cálculo III', period: '3º período', type: 'OBRIGATORIA' },
      { name: 'Otimização e Pesquisa Operacional', period: '3º período', type: 'OBRIGATORIA' },
      { name: 'Qualidade e Produtividade', period: '3º período', type: 'OBRIGATORIA' },
      { name: 'Logística e Supply Chain', period: '3º período', type: 'OBRIGATORIA' }
    ]
  }
};

module.exports = DEFAULT_COURSES;
