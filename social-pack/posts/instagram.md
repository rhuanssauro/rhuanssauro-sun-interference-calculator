# Instagram: Sun interference (PT-BR + EN-US)

## PT-BR

Interferência Solar: Marquediabéisso????

Setembro chegou e o BR de novo nessa novela. Antena fica maluca, perde apontamento, e o pessoal jura que é o modem.

Duas vezes por ano o Sol senta na linha de visada da GEO. A parabólica não distingue ruído térmico solar da portadora. A gente chama de interferência solar, sun transit, sun fade, sun outage. Só o RX leva a porrada. TX pode tá de boa.

Aqui no Sudeste, no fim da janela de setembro, um 2,4M em Banda C pode ficar uns seis minutos com o dish flutuando no feixe de 3 dB. Ou perde o tracking, dá "Demod Unlock" e a antena entra em loop de searching. Deus me livre se os offsets tiverem tortos. Órbita inclinada???? Nem me fala (assunto pra outro post).

VSAT "morre misteriosamente" toda manhã de setembro, AGC doido, LOS limpa, config impecável? Eu coloco 10 conto que não é hardware. É o Astro Rei sentado no feixe como se a casa fosse dele.

Montei um verificador aberto pra essa geometria. Slot, site, diâmetro, frequência de RX. Ele diz se tá Impacted, fora de vista ou fora de estação, com UTC de início, fim e duração. Sem 10 portais de operadora, sem excel, sem sofrência. Inclusive pra você, campanha que caiu de paraquedas no SATCOM.

Repo aberto: https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator

Manda pra quem precisa. Contribui se quiser.

#InterferenciaSolar #SunOutage #SATCOM #VSAT #GEO #BandaC #ComunicacaoViaSatelite #SunTransit #TelecomBR

Fontes:
https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf
https://my.intelsat.com/si/public/
https://my.intelsat.com/resource/si/Sun_Interference_Background.pdf
https://www.hispasat.com/en/useful-information/solar-interference-calculator
https://app.telesat.com/sun-transit-calculator
https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json

https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator

## EN-US

Sun interference: what the hell is this????

September shows up and Brazil is back in this soap opera. Dish goes crazy, loses pointing, and everybody swears it is the modem.

Twice a year the Sun sits in the line of sight of a GEO antenna. The dish cannot tell solar thermal noise from the carrier. We call that sun interference, sun transit, sun fade, sun outage. RX takes the beating. TX can still be fine.

Here in Southeast Brazil, late in the September window, a 2.4 m C-band reflector can sit about six minutes with the dish floating inside the 3 dB beam. Or it loses tracking, throws a "Demod Unlock" and the antenna goes into a searching loop. God help you if the offsets are crooked. Inclined orbit???? Don't even start (topic for another post).

VSAT "mysteriously dies" every September morning, AGC going nuts, clean LOS, config looking perfect? I put ten bucks on it not being hardware. It is the Sun sitting in the beam like he owns the place.

I put together an open checker for that geometry. Slot, site, diameter, RX frequency. It tells you Impacted, not in view, or out of season, with UTC start, end and duration. No 10 operator portals, no Excel, no suffering. Even for you, field tech who got dropped into SATCOM.

Open repo: https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator

Send it to whoever needs it. Contribute if you want.

#SunOutage #SunInterference #SATCOM #VSAT #GEO #CBand #SatelliteCommunications #SunTransit #RFEngineering

Sources:
https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf
https://my.intelsat.com/si/public/
https://my.intelsat.com/resource/si/Sun_Interference_Background.pdf
https://www.hispasat.com/en/useful-information/solar-interference-calculator
https://app.telesat.com/sun-transit-calculator
https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json

https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator
