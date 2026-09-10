# LinkedIn: Sun interference (PT-BR + EN-US)

## PT-BR

Interferência Solar na comunicação via satélite: Marquediabéisso????

Chegando o mês de Setembro, nosso amado BR encara mais um período de interferência solar, assim como temos mais para o começo do ano. Com isso, as antenas ficam "malucas" e perdem apontamento mas, você ja se perguntou porque isso acontece??

Duas períodos por  por ano o Sol entra na linha de visada de uma antena GEO. A parabólica não distingue ruído térmico solar da portadora. A gente chama isso de interferência solar, sun transit, sun fade, sun outage.

É problema de recepção puramente falando. RX é que leva a porrada. Aqui no Sudeste do Brasil, no fim da janela de setembro, um refletor de 2,4M em Banda C pode ficar uns seis minutos com o dish flutuando dentro do feixe de 3 dB ou até mesmo perder totalmente o tracking, causando um "Demod Unlock", que pode vir a fazer a antena a entrar em um loop de searching e, Deus me livre se os offsets não estiverem ajustados corretamente! Imagina ainda se estivermos trabalhando em órbita inclinada???? (Já é um assunto para outro post)
Se a VSAT "morre misteriosamente" toda manhã de setembro com variação brusca de AGC, LOS limpa, configuração impecável, eu coloco uns 10 conto que que não é o modem ou qualquer falhar de hardware, mas é o nosso Astro Rei sentado no feixe como se a casa fosse dele.

Pensando em "coisas que eu gostaria de saber quando comecei nessa área", montei um verificador aberto pra essa geometria. Você escolhe o slot, o site, o diâmetro e a frequência de recepção. Ele diz se está Impacted, fora de vista ou fora de estação, com UTC de início, fim e duração. Sem precisar ir em 10 portais diferentes dependendo da Operadora do Satélite para pegar uma previsão, jogar num excel e mandar pros seus clientes ou para que você mesmo, meu campanha que não é nativo de SATCOM mas caiu de paraquedas, possa verificar de maneira mais autonoma. 

O repositório publico e de código aberto está em https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator

Fique a vontade para compartilhar com qualquer pessoa que você acha que pode gostar e também a vontade para contribuir.

#SATCOM #VSAT #InterferenciaSolar #ComunicacaoViaSatelite #SunOutage

Fontes:
https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf
https://my.intelsat.com/si/public/
https://my.intelsat.com/resource/si/Sun_Interference_Background.pdf
https://www.hispasat.com/en/useful-information/solar-interference-calculator
https://app.telesat.com/sun-transit-calculator
https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json


## EN-US

Sun interference in satellite comms: what the hell is this????

September rolls in and our beloved Brazil hits another sun interference window, same as we get at the start of the year. The antennas go "crazy" and lose pointing, but have you ever asked yourself why this happens??

Twice a year the Sun walks into the line of sight of a GEO antenna. The dish cannot tell solar thermal noise from the carrier. We call that sun interference, sun transit, sun fade, sun outage.

Receive path, purely speaking. RX is the one that takes the beating. Here in Southeast Brazil, late in the September window, a 2.4 m C-band reflector can sit about six minutes with the dish floating inside the 3 dB beam, or even lose tracking altogether and throw a "Demod Unlock", which can send the antenna into a searching loop, and God help you if the offsets are not set right! Now imagine we are working inclined orbit???? (That's a topic for another post)
If the VSAT "mysteriously dies" every September morning with a sudden AGC swing, clean LOS, config looking perfect, I would put ten bucks on it not being the modem or any hardware fault. It is the Sun sitting in the beam like he owns the place.

Thinking about "things I wish I knew when I started in this field", I put together an open checker for that geometry. You pick the slot, the site, the diameter and the receive frequency. It tells you if you are Impacted, not in view, or out of season, with UTC start, end and duration. No need to bounce through 10 different portals depending on the satellite operator just to grab a forecast, dump it into Excel and send it to your customers, or so you yourself, my field tech who is not a SATCOM native but got dropped into this, can check it more on your own.

The public open-source repo is at https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator

Feel free to share it with anyone you think might like it, and feel free to contribute too.

#SATCOM #VSAT #SunOutage #SatelliteCommunications #RFEngineering

Sources:
https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf
https://my.intelsat.com/si/public/
https://my.intelsat.com/resource/si/Sun_Interference_Background.pdf
https://www.hispasat.com/en/useful-information/solar-interference-calculator
https://app.telesat.com/sun-transit-calculator
https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json

https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator
