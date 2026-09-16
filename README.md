# NeuroEdu — Arquitetura do Sistema de Neuro-educação Personalizada

O ciclo operacional e a política efetivamente implementada estão em [WORKFLOW_BASICO.md](WORKFLOW_BASICO.md). Esse documento é autoritativo para consentimento, início de sessão, IA, revisão e retenção.

**Versão:** 1.0.0 | **Data:** 2026-06-05 | **Plataforma:** Google Apps Script + Google Colab

---

## 1. Visão Geral

O **NeuroEdu** é um sistema de acompanhamento de indicadores biométricos individuais para promoção de neuro-educação personalizada e adaptação curricular baseada em evidências fisiológicas objetivas. O sistema integra três plataformas Google em nuvem:

| Camada | Plataforma | Responsabilidade |
|---|---|---|
| **Frontend** | Google Apps Script (HtmlService) | Interface web SPA servida via Web App |
| **Backend** | Google Apps Script (.gs) | Lógica de negócio, CRUD, alertas, relatórios |
| **Persistência** | Google Sheets (SPREADSHEETS_ID) | Banco de dados central de todo o sistema |
| **Aquisição** | Google Colab (notebook.py) | Coleta e pré-processamento biométrico |

### Fluxo de trabalho

#### Pré-requisitos

- Node.js 20 LTS (versão de referência em `.nvmrc`);
- Python 3 para validar os módulos de aquisição e geração;
- acesso ao projeto no Google Apps Script apenas para sincronização ou implantação;
- autenticação inicial do cliente remoto com `npx clasp login`.

#### Primeira execução

```bash
npm install
npm run verify
```

`verify` é o gate local: valida o manifesto, os 24 pares de aplicação/servidor,
a sintaxe dos arquivos Python e os contratos Node. Ele não acessa o Google nem
altera o projeto remoto.

#### Ciclo cotidiano

1. Consulte o payload local com `npm run status`.
2. Use `npm run pull` somente quando a versão remota for a fonte correta; o comando pode sobrescrever arquivos locais.
3. Implemente a mudança e atualize os testes em `tests/`.
4. Execute `npm run verify`.
5. Revise as alterações e use `npm run push`; o gate roda automaticamente antes do envio.

Use `npm run open` para abrir o editor remoto e `npm run logs` para consultar registros.
`npm run deploy` verifica, envia e cria uma nova implantação, portanto deve ser
reservado para uma versão revisada e funcionalmente testada.

---

## 2. Biossensores Integrados

| Sensor | Modalidade | Métricas Extraídas |
|---|---|---|
| **Muse 2** (EEG) | Eletroencefalografia | Razão Teta/Alfa, potência por banda, índice de engajamento, burst de Gama |
| **Samsung Galaxy Watch 5** (ECG/EDA) | Eletrocardiograma + Atividade Eletrodérmica | HRV (RMSSD, SDNN), FC, intervalos RR, condutância da pele, picos fásicos |
| **Tobii Eye Tracker 5** (POG) | Rastreamento Ocular | Duração de fixações, regressões, velocidade de sacadas, posição do olhar |

---

## 3. Estrutura de Arquivos (Pasta Raiz — 75 arquivos)

### 3.1 Arquivos .gs — Backend Google Apps Script (40 arquivos)

#### Núcleo do Sistema (8 arquivos)

| Arquivo | Responsabilidade Principal |
|---|---|
| `Code.gs` | Ponto de entrada: doGet(), doPost(), roteador de actions, processLogin(), processLogout() |
| `Config.gs` | Constantes globais: SPREADSHEETS_ID (via PropertiesService), nomes de abas, limiares de alertas |
| `Auth.gs` | Autenticação texto plano: login(), logout(), validateToken(), createUser() — aba Usuarios |
| `Database.gs` | Camada de abstração do Sheets: appendRow(), getAll(), findById(), updateById(), deleteById() |
| `Utils.gs` | Utilitários: calcMean(), calcStdDev(), clamp(), sanitizeString(), formatDate(), generateUUID() |
| `Triggers.gs` | Gatilhos nativos GAS: setupTriggers(), onDailyConsolidate() (23h), onWeeklySummary() (domingo) |
| `StudentController.gs` | CRUD de estudantes: create(), list(), getById(), update(), delete() — aba Estudantes |
| `TeacherController.gs` | CRUD de professores: create(), list(), getById(), update(), delete() — aba Professores |

#### Controladores de Domínio (8 arquivos)

| Arquivo | Responsabilidade Principal |
|---|---|
| `ClassController.gs` | CRUD de turmas e vinculação professor-turma — aba Turmas |
| `SensorController.gs` | Registro e status de biossensores por estudante — aba Sensores |
| `SessionController.gs` | Ciclo de vida de sessões biométricas: start(), end(), list() — aba Sessoes |
| `BiometricDataController.gs` | Recebe e persiste dados multimodais (EEG+ECG+EDA+POG) do notebook.py |
| `AlertController.gs` | Geração, persistência e resolução de alertas pedagógicos — aba Alertas |
| `InterventionController.gs` | Registro de intervenções pedagógicas vinculadas a alertas — aba Intervencoes |
| `ReportController.gs` | Geração de relatórios individuais, por turma e comparativos — aba Relatorios |
| `GamificationController.gs` | Detecção de estado de fluxo e ajuste adaptativo de dificuldade — aba Gamificacao |

#### Aplicações de Neuro-educação (24 arquivos — App01 a App24)

| Arquivo | Aplicação | Sensores |
|---|---|---|
| `App01_ReadingFluency.gs` | Diagnóstico de Fluência de Leitura | POG + EEG |
| `App02_MathAnxiety.gs` | Monitoramento de Ansiedade em Matemática | ECG + EDA |
| `App03_ADHDRegulation.gs` | Treinamento de Autorregulação para TDAH | EEG + ECG + EDA |
| `App04_ScienceLab.gs` | Laboratório de Ciências — Sistema Circulatório | ECG + EDA |
| `App05_AACNonVerbal.gs` | Comunicação Aumentativa para Alunos Não-Verbais | POG + EEG |
| `App06_GamificationEngagement.gs` | Avaliação de Engajamento em Gamificação | EEG + EDA + ECG |
| `App07_PhysicalEd.gs` | Educação Física Personalizada (zonas BDNF) | ECG + EDA |
| `App08_DyslexiaFocus.gs` | Treinamento de Foco Visual em Dislexia | POG + ECG + EDA |
| `App09_WorkingMemory.gs` | Avaliação de Memória de Trabalho | EEG + POG |
| `App10_Mindfulness.gs` | Mindfulness e Foco em Sala de Aula | EEG + ECG + EDA |
| `App11_AhaMoments.gs` | Monitoramento de Momentos Eureka | EEG + EDA + ECG |
| `App12_Ergonomics.gs` | Ergonomia e Conforto em Sala de Aula | EDA + POG + ECG |
| `App13_ExpressiveReading.gs` | Treinamento de Leitura Expressiva | POG + ECG + EDA |
| `App14_StudyPatterns.gs` | Identificação de Padrões de Estudo Ineficazes | POG + EEG |
| `App15_MethodologyImpact.gs` | Avaliação de Impacto de Metodologias de Ensino | EEG + EDA + ECG |
| `App16_ReactionGames.gs` | Jogos de Reação e Controle de Impulsividade | POG + EEG |
| `App17_DistractionMicroMoments.gs` | Detecção de Micro-momentos de Distração | POG + EDA + ECG |
| `App18_CreativeWriting.gs` | Escrita Criativa e Fluxo de Ideias | EEG + ECG + EDA |
| `App19_ArtisticFeedback.gs` | Retorno Fisiológico em Atividades Artísticas | EDA + ECG |
| `App20_LearningPreferences.gs` | Avaliação de Preferências de Aprendizado | EDA + POG + ECG |
| `App21_STEMEffort.gs` | Monitoramento de Esforço Produtivo em STEM | EEG + ECG + EDA |
| `App22_LeadershipStyles.gs` | Identificação de Estilos de Liderança em Grupos | ECG + EDA |
| `App23_MusicTherapy.gs` | Musicoterapia e Foco em Matemática | EEG + ECG + EDA |
| `App24_PostErrorResilience.gs` | Avaliação de Resiliência Pós-erro | EDA + ECG |

---

### 3.2 Arquivos .html — Frontend HtmlService (34 arquivos)

#### Estrutura SPA (4 arquivos)

| Arquivo | Responsabilidade |
|---|---|
| `Index.html` | Layout principal SPA; estado global NeuroEdu; navegação entre views; verificação de sessão |
| `Login.html` | Formulário de autenticação texto plano; chama processLogin() via google.script.run |
| `Header.html` | Barra superior; badge de alertas críticos (polling 30s); botão logout |
| `Sidebar.html` | Menu lateral; navegação por módulos; controle de acesso por papel (role) |

#### Módulos de Gestão (6 arquivos)

| Arquivo | Responsabilidade |
|---|---|
| `Dashboard.html` | Cards de métricas agregadas; gráficos de tendência; acesso rápido |
| `StudentsView.html` | Tabela paginada de estudantes; CRUD via modal |
| `StudentProfile.html` | Perfil biométrico completo; gráficos de evolução temporal |
| `TeachersView.html` | Gestão de professores; vinculação a turmas |
| `ClassesView.html` | Gestão de turmas; contagem de estudantes |
| `SensorsView.html` | Status dos biossensores; calibração; qualidade de sinal |

#### Módulos de Monitoramento (6 arquivos)

| Arquivo | Responsabilidade |
|---|---|
| `LiveMonitoring.html` | Dashboard ao vivo; polling 2s; toast de alertas |
| `SessionManager.html` | Iniciar/encerrar sessões; timer em andamento |
| `AlertsPanel.html` | Alertas por severidade; botão de resolução; sugestões de intervenção |
| `InterventionsLog.html` | Histórico de intervenções; formulário de registro |
| `ReportsGenerator.html` | Geração e preview de relatórios; exportação |
| `Settings.html` | Configurações de limiares; gestão de usuários (admin) |

#### Interfaces das 24 Aplicações (18 arquivos)

| Arquivo | Aplicações Cobertas |
|---|---|
| `App_Reading.html` | App01 (Fluência de Leitura) + App13 (Leitura Expressiva) |
| `App_Math.html` | App02 (Ansiedade Matemática) |
| `App_ADHD.html` | App03 (Autorregulação TDAH) |
| `App_Science.html` | App04 (Laboratório de Ciências) |
| `App_AAC.html` | App05 (Comunicação Aumentativa) |
| `App_Gamification.html` | App06 (Engajamento) + App16 (Jogos de Reação) |
| `App_PhysicalEd.html` | App07 (Educação Física) |
| `App_Dyslexia.html` | App08 (Foco Visual — Dislexia) |
| `App_Memory.html` | App09 (Memória de Trabalho) |
| `App_Mindfulness.html` | App10 (Mindfulness) |
| `App_AhaMoments.html` | App11 (Momentos Eureka) |
| `App_Ergonomics.html` | App12 (Ergonomia) |
| `App_StudyPatterns.html` | App14 (Padrões de Estudo) + App17 (Micro-distrações) |
| `App_Methodologies.html` | App15 (Metodologias de Ensino) |
| `App_Arts.html` | App18 (Escrita Criativa) + App19 (Retorno Artístico) |
| `App_Preferences.html` | App20 (Preferências de Aprendizado) |
| `App_STEM.html` | App21 (Esforço STEM) + App22 (Liderança) |
| `App_Resilience.html` | App23 (Musicoterapia) + App24 (Resiliência Pós-erro) |

---

### 3.3 notebook.py — Google Colab (1 arquivo)

| Módulo | Função |
|---|---|
| Módulo 1 — EEG | bandpass_filter(), compute_band_power(), process_eeg() |
| Módulo 2 — ECG/HRV | detect_r_peaks(), compute_hrv(), process_ecg() |
| Módulo 3 — EDA | process_eda() — decomposição SCL/SCR, detecção de picos |
| Módulo 4 — POG | classify_fixations_saccades() (I-VT), process_pog() |
| Módulo 5 — GAS | send_to_gas() — HTTP POST com payload JSON estruturado |
| Módulo 6 — Simulação | simulate_eeg/ecg/eda/pog_samples() para testes sem hardware |
| Módulo 7 — Loop | init_sensors(), collect_and_process(), main_loop() |

---

## 4. Estrutura da Google Planilha (SPREADSHEETS_ID)

| Aba | Conteúdo | Controlador Principal |
|---|---|---|
| `Usuarios` | Credenciais texto plano (username, password, role) | Auth.gs |
| `Estudantes` | Dados demográficos e condições especiais | StudentController.gs |
| `Professores` | Dados dos professores | TeacherController.gs |
| `Turmas` | Turmas e vinculações | ClassController.gs |
| `Sensores` | Registro e status dos biossensores | SensorController.gs |
| `Sessoes` | Sessões biométricas (início, fim, turma, aplicação) | SessionController.gs |
| `DadosBiometricos` | Dados brutos multimodais (EEG+ECG+EDA+POG) | BiometricDataController.gs |
| `Alertas` | Alertas pedagógicos com status e resolução | AlertController.gs |
| `Intervencoes` | Registro de intervenções pedagógicas | InterventionController.gs |
| `Relatorios` | Relatórios gerados (JSON serializado) | ReportController.gs |
| `Gamificacao` | Histórico de estados de fluxo e dificuldade | GamificationController.gs |
| App_01 a App_24 | Dados específicos de cada aplicação | App01_*.gs a App24_*.gs |

---

## 5. Gatilhos Nativos do Google Apps Script (Triggers.gs)

| Gatilho | Tipo | Horário | Função |
|---|---|---|---|
| onDailyConsolidate | Time-driven | Diário às 23h | ReportController_.consolidateDaily() |
| onWeeklySummary | Time-driven | Domingo às 8h | ReportController_.generateWeeklySummary() + e-mail |
| onHourlyAlertCheck | Time-driven | A cada hora | AlertController_.analyzeSession() para sessões encerradas |

---

## 6. Autenticação e Papéis

| Papel | Acesso |
|---|---|
| admin | Todos os módulos + Configurações + Gestão de usuários |
| professor | Gestão de estudantes/turmas + Monitoramento + Aplicações + Relatórios |
| coordenador | Relatórios + Dashboard (somente leitura) |

> Conforme requisito do projeto, senhas são armazenadas em texto plano na aba Usuarios da planilha Google Sheets. O token de sessão é um UUID gerado no login e invalidado no logout.

---

## 7. Configuração Inicial

1. Criar uma Google Planilha e copiar o SPREADSHEETS_ID da URL
2. No Google Apps Script, ir em Projeto > Propriedades do Script e adicionar: SPREADSHEETS_ID e ADMIN_EMAIL
3. Executar Triggers.setupTriggers() para registrar os gatilhos automáticos
4. Executar Auth.createInitialAdmin() para criar o primeiro usuário admin
5. Publicar como Web App: Implantar > Novo Implantação > Web App
6. No Google Colab, configurar GAS_WEB_APP_URL no notebook.py e executar main_loop()

---

## 8. Verificação e relatórios de maturidade

O gate executável e mantido do projeto é `npm run verify`. Os arquivos
`RELATORIO_MATURIDADE_BACKEND.md`, `RELATORIO_MATURIDADE_FRONTEND.md` e
`RELATORIO_MATURIDADE_PROJETO.md` são registros de auditorias anteriores e não
substituem a verificação atual. Se um novo auditor de maturidade for incorporado,
ele deve ser chamado por `verify` e coberto por teste antes de ser documentado como gate.
