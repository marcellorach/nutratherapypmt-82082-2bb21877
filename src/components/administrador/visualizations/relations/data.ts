// Movendo os dados de exemplo para um arquivo separado
export const exampleSankeyData = {
  nodes: [
    // Nutracêuticos
    { name: 'Glucosamina', category: 'nutraceutico', description: 'Aminossacarídeo natural que ajuda na formação e reparo de cartilagem' },
    { name: 'Condroitina', category: 'nutraceutico', description: 'Glicosaminoglicano encontrado na cartilagem que ajuda na elasticidade' },
    { name: 'Ômega 3', category: 'nutraceutico', description: 'Ácidos graxos essenciais com propriedades anti-inflamatórias' },
    { name: 'Curcumina', category: 'nutraceutico', description: 'Composto polifenólico da cúrcuma com potentes propriedades anti-inflamatórias' },
    { name: 'MSM', category: 'nutraceutico', description: 'Composto orgânico de enxofre com propriedades anti-inflamatórias' },
    { name: 'Coenzima Q10', category: 'nutraceutico', description: 'Composto similar a vitaminas produzido pelo corpo com funções antioxidantes' },
    { name: 'Resveratrol', category: 'nutraceutico', description: 'Polifenol com propriedades antioxidantes encontrado em uvas e vinho tinto' },
    { name: 'Ácido Hialurônico', category: 'nutraceutico', description: 'Glicosaminoglicano com função importante na hidratação tecidual e lubrificação articular' },
    
    // Condições
    { name: 'Artrite', category: 'condicao', description: 'Inflamação das articulações que causa dor e rigidez' },
    { name: 'Inflamação', category: 'condicao', description: 'Resposta do sistema imunológico a lesões ou infecções' },
    { name: 'Saúde Cardíaca', category: 'condicao', description: 'Manutenção da função cardiovascular saudável' },
    { name: 'Função Cognitiva', category: 'condicao', description: 'Processos mentais incluindo memória, aprendizado e foco' },
    { name: 'Saúde da Pele', category: 'condicao', description: 'Manutenção da saúde e aparência da pele' },
    { name: 'Mobilidade Articular', category: 'condicao', description: 'Capacidade de movimento das articulações com amplitude completa' },
    { name: 'Densidade Óssea', category: 'condicao', description: 'Medida da quantidade de minerais nos ossos' },
    { name: 'Sistema Imune', category: 'condicao', description: 'Rede de células, tecidos e órgãos que defendem o corpo contra infecções' },
  ],
  links: [
    // Glucosamina
    { source: 0, target: 8, value: 85, labelText: 'Alta eficácia', studyCount: 12, evidenceLevel: 4.2, description: 'Glucosamina demonstra alta eficácia no alívio dos sintomas da artrite, particularmente na redução da dor e melhoria da função articular em cães.' },
    { source: 0, target: 9, value: 40, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 2.8 },
    { source: 0, target: 13, value: 75, labelText: 'Eficácia alta', studyCount: 8, evidenceLevel: 3.9 },
    
    // Condroitina
    { source: 1, target: 8, value: 70, labelText: 'Eficácia alta', studyCount: 9, evidenceLevel: 3.7 },
    { source: 1, target: 13, value: 80, labelText: 'Eficácia muito alta', studyCount: 7, evidenceLevel: 4.0 },
    
    // Ômega 3
    { source: 2, target: 9, value: 75, labelText: 'Eficácia alta', studyCount: 15, evidenceLevel: 4.1 },
    { source: 2, target: 10, value: 60, labelText: 'Eficácia moderada', studyCount: 11, evidenceLevel: 3.8 },
    { source: 2, target: 12, value: 50, labelText: 'Eficácia moderada', studyCount: 6, evidenceLevel: 3.2 },
    { source: 2, target: 15, value: 65, labelText: 'Eficácia moderada-alta', studyCount: 8, evidenceLevel: 3.5 },
    
    // Curcumina
    { source: 3, target: 9, value: 90, labelText: 'Eficácia muito alta', studyCount: 18, evidenceLevel: 4.5, description: 'A curcumina mostra resultados excepcionais no controle de processos inflamatórios em múltiplos sistemas do organismo, com alta biodisponibilidade em formulações específicas para pets.' },
    { source: 3, target: 8, value: 45, labelText: 'Eficácia moderada', studyCount: 7, evidenceLevel: 3.0 },
    { source: 3, target: 15, value: 70, labelText: 'Eficácia alta', studyCount: 9, evidenceLevel: 3.8 },
    
    // MSM
    { source: 4, target: 8, value: 65, labelText: 'Eficácia moderada-alta', studyCount: 8, evidenceLevel: 3.4 },
    { source: 4, target: 9, value: 55, labelText: 'Eficácia moderada', studyCount: 6, evidenceLevel: 3.1 },
    { source: 4, target: 13, value: 60, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 3.3 },
    
    // Coenzima Q10
    { source: 5, target: 10, value: 80, labelText: 'Eficácia alta', studyCount: 14, evidenceLevel: 4.2, description: 'Coenzima Q10 é essencial para a produção de energia celular e função cardíaca, demonstrando resultados significativos na melhoria da função miocárdica em cães idosos e com problemas cardíacos.' },
    { source: 5, target: 11, value: 45, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 2.9 },
    
    // Resveratrol
    { source: 6, target: 10, value: 55, labelText: 'Eficácia moderada', studyCount: 7, evidenceLevel: 3.2 },
    { source: 6, target: 11, value: 60, labelText: 'Eficácia moderada', studyCount: 6, evidenceLevel: 3.5 },
    { source: 6, target: 15, value: 50, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 3.0 },
    
    // Ácido Hialurônico
    { source: 7, target: 8, value: 75, labelText: 'Eficácia alta', studyCount: 9, evidenceLevel: 3.9 },
    { source: 7, target: 12, value: 70, labelText: 'Eficácia alta', studyCount: 8, evidenceLevel: 3.7 },
    { source: 7, target: 13, value: 85, labelText: 'Eficácia muito alta', studyCount: 11, evidenceLevel: 4.3, description: 'O ácido hialurônico tem papel fundamental na manutenção da viscosidade do líquido sinovial, proporcionando lubrificação ideal e absorção de choque nas articulações de pets com problemas de mobilidade.' },
  ]
};
