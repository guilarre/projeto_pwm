# Projeto final da disciplina de Programação Web e Mobile

## Requisitos

Os requisitos completos do projeto podem ser acessados [aqui](https://github.com/guilarre/projeto_pwm/blob/main/requisitos-projeto.pdf)

## Processamento dos dados (ETL)

### Extração dos dados e visão geral

Usamos os dados estáticos abertos do Grande Recife Consórcio de Transporte que nos trazem as localizações e horários dos ônibus da Região Metropolitana de Recife.

É possível realizar download dos dados mais atuais diretamente no link do Grande Recife [\[1\]](https://www.granderecife.pe.gov.br/gtfs/gtfs.zip) ou outras versões no site da API principal (transit.land). [\[2\]](https://www.transit.land/data/feeds/f-7nx-granderecife)

Para o projeto, foi utilizada a versão [`v2026.10.26`](https://www.transit.land/data/feeds/f-7nx-granderecife/versions/7967355078b724ab9c7f136a7b2a950813b0691a). Ele contém dados sobre 7238 paradas e 400 rotas diferentes.

Os dados vêm zipados em `gtfs.zip`, e consistem de arquivos .txt (estruturados como csv), contendo diversas tabelas relacionadas por chaves primárias e estrangeiras.

- agency.txt
- calendar.txt
- calendar_dates.txt
- fare_attributes.txt
- fare_rules.txt
- feed_info.txt
- routes.txt
- shapes.txt
- stop_times.txt
- stops.txt
- transfers.txt
- trips.txt


| Arquivo | Descrição | Chaves principais |
| --- | --- | --- |
| agency.txt | Agências de transporte operadoras dos serviços (nome, URL e fuso horário). | agency_id (PK) |
| calendar.txt | Dias da semana em que os serviços de transporte operam regularmente. | service_id (PK) |
| calendar_dates.txt | Exceções de calendário para dias específicos (feriados, frotas diminuídas ou serviços extras). | service_id, date (FK, PK) |
| fare_attributes.txt | Informações de tarifas e regras de preço, moeda e formas de pagamento. | fare_id (PK) |
| fare_rules.txt | Regras para aplicação das tarifas associadas a rotas específicas ou zonas. | fare_id, route_id (FK, FK) -> tabela associativa |
| feed_info.txt | Metadados sobre a publicação do feed GTFS (editor, versão, datas de início e fim). | --- |
| routes.txt | Rotas ou linhas de transporte público operadas pelas agências. | route_id, agency_id (PK, FK) |
| shapes.txt | Sequência de coordenadas geográficas (latitude/longitude) que desenham o traçado físico das rotas no mapa. | shape_id, shape_pt_sequence (PK, PK) |
| stop_times.txt | Horários de chegada e partida de cada viagem em cada parada do itinerário. | trip_id, stop_sequence (FK, FK->stop_id)    |
| stops.txt | Cadastro geográfico das paradas, estações e plataformas de embarque/desembarque. | stop_id (PK) |
| transfers.txt | Regras de tempo e conexões/transferências permitidas entre diferentes paradas ou rotas. | from_stop_id, to_stop_id (FK, FK) -> tabela associativa |
| trips.txt | Viagens individuais que compõem as rotas, definindo o sentido (direction_id), destino (trip_headsign) e regras de calendário. | trip_id (PK), route_id (FK), service_id (FK), shape_id (FK) |


### Transformação dos dados (pré-processamento)

Visando diminuir o tamanho final do nosso arquivo `.apk` em disco, criamos um servidor para banco de dados gratuito no site Back4App.

Usando o servidor, foi possível realizar as nossas queries complexas por meio das `funções Cloud Code` do Back4App (em [back4app-cloudcode/main.js](https://github.com/guilarre/projeto_pwm/tree/main/back4app-cloudcode)), que executam a lógica server-side para nós, deixando as queries mais rápidas, sem gastar processamento do celular.

Na etapa de pré-processamento dos dados, utilizamos apenas os dados em:

- calendar.txt
- calendar_dates.txt
- routes.txt
- shapes.txt
- stop_times.txt
- stops.txt
- trips.txt

Criamos [scripts](https://github.com/guilarre/projeto_pwm/tree/main/scripts) para filtrar apenas os dados sobre 10 ônibus (como referência, usamos a parada Av. Getúlio Vargas, 1207, Olinda):

    Que passam na parada Av. Getúlio Vargas, 1207:
    - (030) Ti Rio Doce / Barra De Jangada
    - (1940) Ti Pe-15 (Circular)
    - (1992) Pau Amarelo
    - (1993) Conjunto Praia Do Janga
    - (1994) Conjunto Beira Mar
    - (522) Ti Rio Doce / Ti Cdu
    - (881) Ti Xambá / Rio Doce (Av. Getúlio Vargas)
    - (886) Ouro Preto / Rio Doce

    Alguns extras:
    - (202) Ti Barro / Ti Macaxeira (Várzea)
    - (2920) Dois Irmãos (Rui Barbosa E Príncipe)

## Referências

https://www.granderecife.pe.gov.br/gtfs/gtfs.zip
https://www.transit.land/data/feeds/f-7nx-granderecife
