# Envio de exames em PDF por quem cuida do paciente

## Problema confirmado
- A leitura de prontuários foi aberta para quem tem acesso à aba de pacientes, mas a gravação continua restrita a administrador, veterinário responsável ou quem criou o cadastro.
- Resultado: outro membro da equipe abre o paciente, envia o PDF e o envio é recusado (arquivo ou registro do exame).
- No cadastro de novo pet, a falha no registro do exame só vai para o console; o usuário não vê nada e o PDF fica órfão.

## Decisão necessária (conflito com contrato anterior)
O contrato de 21/09 proibiu alterar regras de gravação. Esta correção abre gravação de exames para quem tem **edição** na aba de pacientes. Argumento contra: amplia quem pode inserir dado clínico; hoje só administrador, cientista (não, é só leitura) e as grades provisórias de coordenador veterinário/veterinário definem quem tem edição.

## O que muda
1. Nova migração (aditiva, sem remover políticas atuais):
   - `pet_exams`: permitir inserir e atualizar (inclui aprovar/reextrair) quando `has_permission(auth.uid(), 'tab.pet-management', 'edit')`.
   - Storage `pet_exams_pdfs`: permitir upload na mesma condição.
2. Mensagens de erro visíveis:
   - `pet-exam-uploader.ts` passa a devolver o motivo da falha; o cadastro de novo pet mostra aviso por arquivo que falhou.
   - Se o registro falhar após o upload, remover o PDF enviado para não deixar órfão.
   - Textos PT/EN com `t()`, incrementando a versão de traduções.
3. Verificação: listar políticas resultantes, typecheck, testes, build.

## Fora do escopo
Grades de papéis, contas, outras tabelas, exclusão, publicação.
