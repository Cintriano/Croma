# Bibliotecas caseiras (Vídeos e Fotos)

As bibliotecas de arquivos caseiros, de vídeos ou de fotos, têm dois tipos de varredura:

1. **Genérica:** a varredura padrão do Jellyfin, sem estrutura obrigatória.
2. **Estruturada (Croma):** segue uma estrutura de pastas com níveis, como as pastas `Nivel_1..3` do v1 (`croma-v1`). **O formato está em desenvolvimento pelo usuário** e será adicionado depois.

A varredura roda no servidor (C#). Por isso, o modo estruturado deve ser um **plugin do Jellyfin**, com resolvedor de itens e leitor de metadados, e mora no `croma-servidor`, em `plugins/`. Isso exige o .NET SDK, que ainda não está instalado. Até lá, a biblioteca usa o modo genérico.

