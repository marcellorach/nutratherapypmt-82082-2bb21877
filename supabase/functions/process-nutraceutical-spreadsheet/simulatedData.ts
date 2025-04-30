
/**
 * Cria entradas simuladas quando não conseguimos extrair da planilha
 * @returns Array de nutracêuticos simulados
 */
export function createSimulatedEntries(): any[] {
  return [
    {
      name: "Ácido Alfa-Lipóico",
      description: "Antioxidante potente que atua em ambientes aquosos e lipídicos",
      category: "Antioxidante",
      conditions: [
        {
          name: "Estresse Oxidativo",
          efficacyScores: {
            prevention: 4.2,
            treatment: 3.5,
            support: 3.0
          },
          studies: [
            "Estudo sobre efeitos do ácido alfa-lipóico em biomarcadores de estresse oxidativo",
            "Análise comparativa de antioxidantes em cães idosos"
          ]
        }
      ]
    },
    {
      name: "Allicina",
      description: "Composto bioativo do alho com propriedades cardioprotetoras",
      category: "Cardíaco",
      conditions: [
        {
          name: "Saúde Cardiovascular",
          efficacyScores: {
            prevention: 3.8,
            treatment: 2.9,
            support: 3.4
          },
          studies: [
            "Estudo clínico sobre efeitos da allicina na pressão arterial canina"
          ]
        }
      ]
    },
    {
      name: "Apigenina",
      description: "Flavonoide com propriedades anti-inflamatórias e anticancerígenas",
      category: "Anti-inflamatório",
      conditions: [
        {
          name: "Câncer Canino",
          efficacyScores: {
            prevention: 3.2,
            treatment: 3.9,
            support: 3.0
          },
          studies: [
            "Estudo in vitro sobre efeitos da apigenina em células cancerígenas caninas"
          ]
        },
        {
          name: "Saúde Óssea",
          efficacyScores: {
            prevention: 2.8,
            treatment: 2.5,
            support: 3.7
          },
          studies: [
            "Análise do suporte da apigenina na manutenção da densidade óssea"
          ]
        }
      ]
    },
    {
      name: "Astaxantina",
      description: "Carotenoide com poderosa ação antioxidante",
      category: "Antioxidante",
      conditions: [
        {
          name: "Saúde Ocular",
          efficacyScores: {
            prevention: 3.5,
            treatment: 2.8,
            support: 4.0
          },
          studies: [
            "Estudo sobre efeitos da astaxantina na saúde ocular de cães idosos"
          ]
        },
        {
          name: "Estresse Oxidativo",
          efficacyScores: {
            prevention: 4.3,
            treatment: 3.2,
            support: 3.5
          },
          studies: [
            "Comparação entre astaxantina e outros antioxidantes em biomarcadores de estresse"
          ]
        }
      ]
    },
    {
      name: "Beta-Glucanas",
      description: "Polissacarídeos que estimulam o sistema imunológico",
      category: "Imunológico",
      conditions: [
        {
          name: "Suporte Imunológico",
          efficacyScores: {
            prevention: 3.4,
            treatment: 3.0,
            support: 4.2
          },
          studies: [
            "Efeitos das beta-glucanas na atividade de células NK em cães"
          ]
        },
        {
          name: "Controle Glicêmico",
          efficacyScores: {
            prevention: 3.6,
            treatment: 3.0,
            support: 3.2
          },
          studies: [
            "Estudo sobre beta-glucanas e controle da glicemia em pets"
          ]
        }
      ]
    },
    // Primeiros 5 itens do array original, o resto será mantido no próximo arquivo
  ];
}

/**
 * Continuação dos dados simulados
 * @returns Segunda parte do array de nutracêuticos simulados
 */
export function createSimulatedEntriesPart2(): any[] {
  return [
    {
      name: "Coenzima Q10",
      description: "Coenzima essencial para produção de energia celular",
      category: "Cardíaco",
      conditions: [
        {
          name: "Disfunção Mitocondrial",
          efficacyScores: {
            prevention: 3.0,
            treatment: 4.1,
            support: 3.5
          },
          studies: [
            "Análise da função mitocondrial após suplementação com CoQ10"
          ]
        },
        {
          name: "Saúde Cardiovascular",
          efficacyScores: {
            prevention: 3.7,
            treatment: 3.3,
            support: 3.5
          },
          studies: [
            "Estudo clínico sobre CoQ10 em cães com cardiomiopatia dilatada"
          ]
        }
      ]
    },
    {
      name: "Curcumina",
      description: "Extrato de Cúrcuma com propriedades anti-inflamatórias",
      category: "Anti-inflamatório",
      conditions: [
        {
          name: "Inflamação Crônica",
          efficacyScores: {
            prevention: 3.2,
            treatment: 4.0,
            support: 3.5
          },
          studies: [
            "Estudo clínico randomizado sobre efeitos anti-inflamatórios da curcumina"
          ]
        },
        {
          name: "Saúde Digestiva",
          efficacyScores: {
            prevention: 3.0,
            treatment: 3.2,
            support: 3.8
          },
          studies: [
            "Efeitos da curcumina na microbiota intestinal canina"
          ]
        }
      ]
    },
    {
      name: "EGCG",
      description: "Catequina do chá verde com múltiplas propriedades benéficas",
      category: "Antioxidante",
      conditions: [
        {
          name: "Saúde Imunológica",
          efficacyScores: {
            prevention: 3.5,
            treatment: 3.0,
            support: 3.9
          },
          studies: [
            "Modulação imunológica pelo EGCG em modelos caninos"
          ]
        }
      ]
    },
    {
      name: "Ergotionina",
      description: "Aminoácido com propriedades antioxidantes",
      category: "Antioxidante",
      conditions: [
        {
          name: "Saúde Muscular",
          efficacyScores: {
            prevention: 3.0,
            treatment: 3.0,
            support: 3.7
          },
          studies: [
            "Estudo sobre regeneração muscular com ergotionina"
          ]
        }
      ]
    },
    {
      name: "Espermidina",
      description: "Poliamina que promove autofagia celular",
      category: "Longevidade",
      conditions: [
        {
          name: "Longevidade Celular",
          efficacyScores: {
            prevention: 3.9,
            treatment: 2.5,
            support: 3.0
          },
          studies: [
            "Efeitos da espermidina na autofagia e longevidade em modelo animal"
          ]
        }
      ]
    },
    // Itens do meio do array original, o resto será mantido no próximo arquivo
  ];
}

/**
 * Continuação dos dados simulados
 * @returns Terceira parte do array de nutracêuticos simulados
 */
export function createSimulatedEntriesPart3(): any[] {
  return [
    {
      name: "Fisetina",
      description: "Flavonoide com efeitos neuroprotetores",
      category: "Neuroprotector",
      conditions: [
        {
          name: "Neuroproteção",
          efficacyScores: {
            prevention: 3.4,
            treatment: 3.0,
            support: 3.7
          },
          studies: [
            "Estudo sobre fisetina e função cognitiva em cães idosos"
          ]
        }
      ]
    },
    {
      name: "Fucoidan",
      description: "Polissacarídeo de algas marinhas com propriedades imunomoduladoras",
      category: "Imunológico",
      conditions: [
        {
          name: "Suporte Imunológico",
          efficacyScores: {
            prevention: 3.3,
            treatment: 2.9,
            support: 3.8
          },
          studies: [
            "Análise da resposta imunológica canina ao fucoidan"
          ]
        },
        {
          name: "Saúde Cardiovascular",
          efficacyScores: {
            prevention: 3.6,
            treatment: 2.8,
            support: 3.0
          },
          studies: [
            "Efeitos do fucoidan na saúde vascular"
          ]
        }
      ]
    },
    {
      name: "Glucosamina",
      description: "Aminomonossacarídeo precursor de glicosaminoglicanos",
      category: "Articular",
      conditions: [
        {
          name: "Osteoartrite",
          efficacyScores: {
            prevention: 3.0,
            treatment: 3.8,
            support: 3.5
          },
          studies: [
            "Meta-análise dos efeitos da glucosamina em cães com osteoartrite"
          ]
        },
        {
          name: "Saúde Articular",
          efficacyScores: {
            prevention: 3.9,
            treatment: 3.2,
            support: 3.5
          },
          studies: [
            "Estudo de acompanhamento de longo prazo sobre mobilidade articular e glucosamina"
          ]
        }
      ]
    },
    {
      name: "L-Carnitina",
      description: "Aminoácido essencial para o metabolismo de gorduras",
      category: "Metabólico",
      conditions: [
        {
          name: "Cardiomiopatia Dilatada",
          efficacyScores: {
            prevention: 3.0,
            treatment: 3.7,
            support: 3.5
          },
          studies: [
            "Uso da L-carnitina em cães com cardiomiopatia dilatada"
          ]
        },
        {
          name: "Obesidade Canina",
          efficacyScores: {
            prevention: 3.2,
            treatment: 3.3,
            support: 3.7
          },
          studies: [
            "Análise do metabolismo lipídico com suplementação de L-carnitina"
          ]
        }
      ]
    },
    {
      name: "Luteolina",
      description: "Flavonoide com propriedades anti-inflamatórias e antioxidantes",
      category: "Neuroprotector",
      conditions: [
        {
          name: "Neuroproteção",
          efficacyScores: {
            prevention: 3.3,
            treatment: 3.0,
            support: 3.6
          },
          studies: [
            "Efeitos da luteolina na neuroproteção em modelo canino"
          ]
        },
        {
          name: "Estresse Oxidativo",
          efficacyScores: {
            prevention: 3.8,
            treatment: 3.2,
            support: 3.0
          },
          studies: [
            "Capacidade antioxidante da luteolina em cães"
          ]
        }
      ]
    },
    // Últimos itens do array original
  ];
}

/**
 * Continuação final dos dados simulados
 * @returns Última parte do array de nutracêuticos simulados
 */
export function createSimulatedEntriesPart4(): any[] {
  return [
    {
      name: "N-Acetilcisteína (NAC)",
      description: "Aminoácido precursor da glutationa com propriedades mucolíticas",
      category: "Antioxidante",
      conditions: [
        {
          name: "Estresse Oxidativo",
          efficacyScores: {
            prevention: 3.5,
            treatment: 3.9,
            support: 3.2
          },
          studies: [
            "Estudo sobre NAC e biomarcadores de estresse oxidativo"
          ]
        },
        {
          name: "Saúde Hepática",
          efficacyScores: {
            prevention: 3.3,
            treatment: 3.2,
            support: 3.7
          },
          studies: [
            "Análise da função hepática após suplementação com NAC"
          ]
        }
      ]
    },
    {
      name: "Ômega-3",
      description: "Ácidos graxos essenciais de cadeia longa EPA e DHA",
      category: "Cardíaco",
      conditions: [
        {
          name: "Osteoartrite",
          efficacyScores: {
            prevention: 3.2,
            treatment: 3.7,
            support: 3.5
          },
          studies: [
            "Estudo sobre ômega-3 e inflamação articular em cães"
          ]
        },
        {
          name: "Saúde Cardiovascular",
          efficacyScores: {
            prevention: 4.0,
            treatment: 3.2,
            support: 3.5
          },
          studies: [
            "Efeitos do ômega-3 no perfil lipídico de cães"
          ]
        },
        {
          name: "Saúde da Pele e Pelagem",
          efficacyScores: {
            prevention: 3.5,
            treatment: 3.0,
            support: 4.1
          },
          studies: [
            "Análise da qualidade da pelagem com suplementação de ômega-3"
          ]
        }
      ]
    },
    {
      name: "Resveratrol",
      description: "Composto fenólico encontrado em uvas e vinho tinto",
      category: "Longevidade",
      conditions: [
        {
          name: "Estresse Oxidativo",
          efficacyScores: {
            prevention: 3.9,
            treatment: 3.0,
            support: 3.2
          },
          studies: [
            "Capacidade antioxidante do resveratrol em cães"
          ]
        },
        {
          name: "Anti-envelhecimento",
          efficacyScores: {
            prevention: 3.6,
            treatment: 2.9,
            support: 3.7
          },
          studies: [
            "Estudo sobre resveratrol e biomarcadores de envelhecimento"
          ]
        }
      ]
    }
  ];
}

/**
 * Combina todas as partes de dados simulados
 * @returns Array completo de nutracêuticos simulados
 */
export function getAllSimulatedEntries(): any[] {
  return [
    ...createSimulatedEntries(),
    ...createSimulatedEntriesPart2(),
    ...createSimulatedEntriesPart3(),
    ...createSimulatedEntriesPart4()
  ];
}
