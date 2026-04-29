# Test Design Rationale

Este documento guarda o raciocinio usado para desenhar e evoluir a suite de testes do portal. A ideia nao e so listar casos, mas preservar os principios que nos ajudaram a implementar testes de forma consistente, robusta e facil de expandir.

## 1. Ordem de crescimento da suite

A suite foi crescida por camadas, do mais estavel para o mais funcional:

1. Autenticacao basica: login valido, login invalido, logout e regressao para a pagina de login.
2. Sessao: confirmar que o utilizador continua autenticado ou desautenticado no estado esperado, incluindo o botao Back do browser.
3. Navegacao: abrir menu lateral, abrir tabs, alternar tabs e validar comportamento com tabs abertas.
4. Paginas funcionais: abrir Mercados e Localizacoes, validar que as tabelas carregam, fazer refresh e abrir tabs de detalhe/edicao.
5. CRUD: criar, editar e eliminar entidades reais, validando o efeito final no sistema e nao apenas o clique nos botoes.

Este crescimento em camadas ajudou-nos a isolar problemas. Quando um teste mais avancado falhava, ja sabiamos se a causa estava na autenticacao, na navegacao ou na propria funcionalidade da pagina.

## 2. Regra principal para validar sucesso

Sempre que possivel, a validacao final de um teste deve apoiar-se no efeito observavel mais forte da aplicacao:

- URL correta
- tabela carregada com a linha esperada
- formulario de detalhe/edicao aberto
- registo criado, renomeado ou removido
- pagina de login visivel apos logout

Toasts e alertas sao uteis, mas foram tratados como sinal auxiliar e nao como prova unica de sucesso, porque em varios fluxos nao aparecem sempre ou desaparecem demasiado depressa.

Exemplos:

- Em vez de validar apenas `Tab criado com sucesso`, passamos a validar tambem `urlContains(...)` e a presenca da tabela ou do formulario correto.
- Em edicoes, o criterio forte passou a ser a abertura do formulario correto e o valor esperado no input, e nao apenas uma mensagem temporaria.
- Em CRUD, a prova forte passou a ser o registo existir, mudar de nome e desaparecer da tabela.

## 3. Como escolhemos seletores

A regra usada foi preferir seletores estaveis e semanticos. A prioridade foi esta:

1. texto visivel unico
2. `role`, `aria-label`, `data-testid`
3. estrutura funcional da pagina, como `button[role='tab']`
4. classes CSS apenas quando nao havia alternativa

Evitar classes geradas por frameworks como Material UI foi importante porque mudam com facilidade e tornam os testes frageis.

Exemplos praticos:

- Logout foi identificado pelo texto `Terminar Sessao`, e nao por uma cadeia longa de classes MUI.
- Tabs de `Mercados` e `Localizacoes` foram identificadas por `role='tab'` e pelo texto dentro de `.tabLabelText`.
- Linhas de tabela foram encontradas por texto de negocio, como `Western Europe` e `Porto de Marselha`.

## 4. Heuristica usada para decidir o que testar

Os testes foram escolhidos para validar comportamento de utilizador, nao apenas componentes isolados.

Perguntas que guiaram a implementacao:

- O utilizador consegue entrar e sair da aplicacao?
- O utilizador volta a um estado seguro depois do logout?
- O utilizador consegue navegar entre areas principais?
- As tabelas principais carregam dados reais?
- O utilizador consegue abrir detalhe/edicao a partir da lista?
- O utilizador consegue completar um CRUD basico sem ficar preso?

Isto levou a uma suite com equilibrio entre:

- testes pequenos e estaveis, como login ou refresh de tabela
- testes de fluxo, como `Mercados -> Localizacoes`
- testes mais funcionais, como criar, editar e eliminar registos

## 5. Quando um teste falhava, como decidimos a correcao

Houve varios tipos de falha durante a implementacao. O raciocinio seguido foi:

### 5.1 Falha de Selenium

Quando o erro era do genero:

- `element not interactable`
- `click intercepted`
- `stale element reference`
- `Wait timed out`

assumimos primeiro um problema de sincronizacao ou seletor, e nao um bug funcional da aplicacao.

Nestes casos, a estrategia foi:

- relocalizar o elemento em vez de reutilizar referencias antigas
- esperar por visibilidade e interatividade reais
- usar `scrollIntoView` e, so quando necessario, fallback para clique por JavaScript
- trocar seletores frageis por seletores ancorados em texto, `role` ou estrutura funcional

### 5.2 Falha de comportamento da aplicacao

Quando o teste chegava ao fim do fluxo, mas o estado final da app nao era o esperado, tratamos isso como potencial bug funcional.

Exemplo claro:

- `TC009` foi mantido como teste util porque revelou duplicacao de tabs `Mercados` quando a expectativa era nao duplicar.

### 5.3 Falso positivo

Quando um teste passava sem provar o comportamento pretendido, a conclusao foi que a validacao estava fraca.

Nesses casos, reforcamos o teste com mais uma confirmacao de estado, normalmente:

- validacao de URL
- validacao da tabela
- validacao de formulario
- confirmacao de existencia ou ausencia do registo

## 6. Padrao usado para adicionar novos flows

O desenho atual permite crescer a suite sem reescrever a base.

O padrao seguido foi:

1. Definir o caso em `src/portal/tests/testCases.json`
2. Acrescentar o `navigationFlow` ou novos campos de input no tipo de teste
3. Implementar o bloco correspondente em [flowRegistry.ts](/C:/Users/alexa/.vscode/projects/Selenium%20+%20UIPath/src/portal/flows/flowRegistry.ts)
4. Reutilizar metodos de page object em [loginPage.ts](/C:/Users/alexa/.vscode/projects/Selenium%20+%20UIPath/src/portal/pages/loginPage.ts) e [navigationPage.ts](/C:/Users/alexa/.vscode/projects/Selenium%20+%20UIPath/src/portal/pages/navigationPage.ts)
5. Validar por efeito final da app, e nao apenas por clique ou toast

Isto evita meter logica complexa diretamente no runner e faz com que cada novo fluxo seja uma combinacao de capacidades ja existentes.

## 7. Principios que ficaram como referencia

- Testar primeiro o que desbloqueia os restantes testes.
- Preferir validacoes de estado final a validacoes de UI transitória.
- Se o teste falha cedo, corrigir sincronizacao e seletores antes de concluir que a app esta errada.
- Se o teste chega ao fim e o resultado funcional esta errado, tratar como bug real ou comportamento por clarificar.
- Reutilizar page objects e helpers em vez de duplicar passos no flow.
- Quando um fluxo novo parece grande demais, parti-lo primeiro em versoes pequenas e depois alargar.

## 8. Como usar este documento daqui para a frente

Quando quisermos adicionar um teste novo, vale a pena passar por estas perguntas:

1. Este caso pertence a autenticacao, sessao, navegacao, tabela, detalhe ou CRUD?
2. Qual e o efeito final mais forte que prova sucesso?
3. Que seletor estavel podemos usar sem depender de classes geradas?
4. O teste esta a validar comportamento real ou apenas uma mensagem temporaria?
5. O fluxo pode ser composto com metodos que ja existem em `NavigationPage` e `LoginPage`?

Se respondermos a isto primeiro, a implementacao costuma ser muito mais rapida e com menos tentativas.
