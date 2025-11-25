<span id="topo"></span>

<h1 align="center"> Mentora </h1>

<h2 align="center"> FATEC Professor Francisco de Moura, Jacareí - 5º Semestre DSM 2025 </h2>



<p align="center">
  <a href="#sobre">Sobre</a> |
  <a href="#acesso">Acesso ao Projeto</a> |
  <a href="#status">Status do Projeto</a> |
  <a href="#sprints">Sprints</a> |
  <a href="#tecnologias">Tecnologias</a> |
  <a href="#equipe">Equipe</a>
</p>



<span id="sobre"></span>

<h1 align="center">Sobre</h1>

<p>

Este projeto foi desenvolvido pelos alunos do 5º semestre de Desenvolvimento de Software Multiplataforma (DSM) da Fatec de Jacareí, como parte da Aprendizagem Baseada em Projeto (ABP). O Mentora é uma plataforma inteligente de apoio acadêmico que utiliza Machine Learning para prever o desempenho acadêmico e o risco de evasão de estudantes.

</p>

<p>

A solução consiste em um aplicativo mobile desenvolvido em React Native, que permite aos alunos preencherem formulários sobre seus hábitos de estudo, frequência, sono, motivação e engajamento. Esses dados são processados por modelos de Machine Learning (Regressão Linear, Regressão Logística e Random Forest) integrados no backend Node.js/TypeScript, que retornam previsões de desempenho acadêmico e classificação de risco de evasão (baixo, médio ou alto).

</p>

<p>

O sistema oferece interfaces específicas para três perfis de usuário: <strong>Alunos</strong> (que recebem previsões personalizadas e feedback explicativo), <strong>Professores</strong> (que acessam dashboards com visão da turma e identificam alunos em risco) e <strong>Instituições de Ensino - IES</strong> (que gerenciam cursos, disciplinas e acompanham métricas agregadas).

</p>



<span id="acesso"></span>

<h1 align="center">Acesso ao Projeto</h1>

<p align="center">
  Experimente a aplicação ou faça o download do instalador para Android.
<br><br>
  <a href="https://drive.google.com/drive/folders/1nU0saP3uhb3UfS3abf6U-9Q2OTon_fiQ" target="_blank">
    <img src="https://img.shields.io/badge/Download-APK-green?style=for-the-badge&logo=android" alt="Download APK">
  </a>
</p>



<span id="status"></span>

<h1 align="center">Status do Product Backlog</h1>



- [x] Desenvolver modelos de Machine Learning para previsão de desempenho

- [x] Criar modelos de Machine Learning para classificação de risco de evasão

- [x] Desenvolver API backend com Node.js/TypeScript

- [x] Implementar autenticação e controle de acesso (JWT)

- [x] Criar sistema de banco de dados (PostgreSQL/SQLite)

- [x] Desenvolver aplicativo mobile com React Native

- [x] Implementar formulários de coleta de dados (hábitos e engajamento)

- [x] Criar dashboards para professores e IES

- [x] Implementar integração de modelos ML no backend

- [x] Desenvolver sistema de feedback explicativo (SHAP)

- [x] Criar telas de visualização de resultados para alunos

- [x] Implementar sistema de gerenciamento de usuários, cursos e disciplinas

- [ ] Implementar sistema de notificações e alertas

- [x] Criar documentação completa do sistema



<span id="sprints"></span>

<h1 align="center">Sprints</h1>



<details>

<summary><h3>Sprint 1 - Modelos ML e Estrutura Base</h3></summary>



**Objetivo:** Desenvolver os modelos de Machine Learning, estruturar a base do projeto e configurar a infraestrutura inicial.



**Resultados Alcançados:**

- Modelos de Machine Learning treinados e prontos (Regressão Linear, Regressão Logística, Random Forest).

- API base implementada com Node.js/TypeScript.

- Banco de dados configurado e estruturado (Prisma ORM).

- Protótipos de telas definidos e validados.

- Integração inicial dos modelos Python no backend via child_process.

- Sistema de autenticação com JWT implementado.

- Estrutura inicial do aplicativo mobile com React Native.



</details>



<details>

<summary><h3>Sprint 2 - Endpoints Completos e Dashboards</h3></summary>



**Objetivo:** Completar os endpoints da API, implementar dashboards iniciais e garantir segurança básica do sistema.



**Resultados Alcançados:**

- Endpoints completos da API implementados (CRUD de usuários, cursos, disciplinas, matrículas).

- Dashboards iniciais para professores e IES desenvolvidos.

- Segurança básica implementada (JWT, bcrypt, validação de dados, sanitização).

- Sistema de execução de modelos ML integrado no backend.

- Formulários de coleta de dados (hábitos e engajamento) implementados no mobile.

- Sistema de feedback explicativo com SHAP implementado.

- CI/CD básico configurado.

- Sistema de redefinição de senha implementado.



</details>



<details open>

<summary><h3>Sprint 3 (Final) - App Mobile Integrado e Finalização</h3></summary>



**Objetivo:** Finalizar a integração completa do aplicativo mobile, implementar dashboards agregados e validar a funcionalidade ponta a ponta do sistema.



**Resultados Alcançados:**

- Aplicativo mobile totalmente integrado com o backend.

- Dashboards agregados por curso/disciplina/professor implementados.

- Telas de visualização de resultados e feedbacks para alunos finalizadas.

- Sistema de gerenciamento completo de usuários, cursos e disciplinas.

- Funcionalidade ponta a ponta validada (aluno → API → dashboards).

- Melhorias de usabilidade e experiência do usuário implementadas.

- Documentação completa do sistema gerada.

- Deploy em ambiente de produção configurado.



</details>



<span id="tecnologias"></span>

<h1 align="center">Tecnologias</h1>

<p align="center">

  <img src="https://img.shields.io/badge/node.js-%23339933?style=for-the-badge&logo=nodedotjs&logoColor=white">

  <img src="https://img.shields.io/badge/typescript-%233178C6?style=for-the-badge&logo=typescript&logoColor=white">

  <img src="https://img.shields.io/badge/react%20native-%2361DAFB?style=for-the-badge&logo=react&logoColor=black">

  <img src="https://img.shields.io/badge/python-%233776AB?style=for-the-badge&logo=python&logoColor=white">

  <img src="https://img.shields.io/badge/scikit--learn-%23F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white">

  <img src="https://img.shields.io/badge/postgresql-%23316192?style=for-the-badge&logo=postgresql&logoColor=white">

  <img src="https://img.shields.io/badge/prisma-%232D3748?style=for-the-badge&logo=prisma&logoColor=white">

  <img src="https://img.shields.io/badge/expo-%23000020?style=for-the-badge&logo=expo&logoColor=white">

  <img src="https://img.shields.io/badge/docker-%232496ED?style=for-the-badge&logo=docker&logoColor=white">

  <img src="https://img.shields.io/badge/jwt-%23000000?style=for-the-badge&logo=json-web-tokens&logoColor=white">

  <img src="https://img.shields.io/badge/pandas-%23150458?style=for-the-badge&logo=pandas&logoColor=white">

  <img src="https://img.shields.io/badge/shap-%23FF6B6B?style=for-the-badge&logo=python&logoColor=white">

</p>



<span id="equipe"></span>

<h1 align="center">Equipe</h1>



<div align="center">



| Função          | Nome                     | GitHub                                                       | LinkedIn |
|-----------------|--------------------------|--------------------------------------------------------------|----------|
| Product Owner   | Mauro do Prado Santos    | [![GitHub Badge](https://img.shields.io/badge/GitHub-111217?style=flat-square&logo=github&logoColor=white)](https://github.com/omaurosantos) | [![Linkedin Badge](https://img.shields.io/badge/Linkedin-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/mauro-do-prado-santos-350b2720a/) |
| Scrum Master    | Jonatas Filipe Carvalho  | [![GitHub Badge](https://img.shields.io/badge/GitHub-111217?style=flat-square&logo=github&logoColor=white)](https://github.com/filipejonatas) | [![Linkedin Badge](https://img.shields.io/badge/Linkedin-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/jonatas-filipe-aa4534165/) |
| Dev Team        | Samuel Lucas Vieira de Melo | [![GitHub Badge](https://img.shields.io/badge/GitHub-111217?style=flat-square&logo=github&logoColor=white)](https://github.com/SamuelLucasVieira) | [![Linkedin Badge](https://img.shields.io/badge/Linkedin-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/samuel-lucas-7a3256144/) |
| Dev Team        | Igor Fonseca             | [![GitHub Badge](https://img.shields.io/badge/GitHub-111217?style=flat-square&logo=github&logoColor=white)](https://github.com/Igor-Fons) | [![Linkedin Badge](https://img.shields.io/badge/Linkedin-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/igor-fonseca-84277226a/) |
| Dev Team        | Vitor Cezar de Souza     | [![GitHub Badge](https://img.shields.io/badge/GitHub-111217?style=flat-square&logo=github&logoColor=white)](https://github.com/vooshybee) | [![Linkedin Badge](https://img.shields.io/badge/Linkedin-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/vitor-souza-29077228b/) |



</div>



<p align="center">

  <a href="#topo">Voltar ao topo</a>

</p>
