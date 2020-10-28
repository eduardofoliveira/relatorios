require('dotenv').config()
const { startOfWeek, endOfWeek, format, subDays } = require('date-fns')
const xlsx = require('xlsx')
const fs = require('fs')

const { enviarEmail } = require('./service/mail')
const CallCountRepository = require('./repository/callCountRepository')

const today = new Date()

const execute = async () => {
  lastWeek = subDays(today, 7)
  let start = format(startOfWeek(lastWeek), 'dd-MM-yyyy HH:mm:ss')
  let end = format(endOfWeek(lastWeek), 'dd-MM-yyyy HH:mm:ss')

  const callCountRepository = new CallCountRepository()
  const { status, parou_ura } = await callCountRepository.showCallDetailByDomain({
    domain: 'premiumsaude.cloudcom.com.br',
     start,
     end
  })

  console.log({ status, parou_ura })

  let lista = []
  const keys = Object.keys(status)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const [onde_parou , did] = key.split('-')
    lista.push([did, onde_parou, status[key]])
  }

  lista = lista.sort((a, b) => {
    if(a[0] < b[0]){
      return - 1
    }
    if(a[0] > b[0]){
      return 1
    }
    if(a[1] < b[1]){
      return - 1
    }
    if(a[1] > b[1]){
      return 1
    }
    return 0
  })

  resultWeekDetails = lista.map(item => {
    return {
      did: item[0],
      onde_terminou: item[1],
      quantidade: item[2]
    }
  })

  console.log(resultWeekDetails)

  const resultWeek = await callCountRepository.showByDomain({
    domain: 'premiumsaude.cloudcom.com.br',
    start,
    end
  })

  console.log(resultWeek)

  const semanal = xlsx.utils.json_to_sheet(resultWeek)
  const details = xlsx.utils.json_to_sheet(resultWeekDetails)
  const detailsParouUra = xlsx.utils.json_to_sheet(parou_ura)

  const wb2 = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb2, semanal, 'Semanal')
  xlsx.utils.book_append_sheet(wb2, details, 'Detalhes')
  xlsx.utils.book_append_sheet(wb2, detailsParouUra, 'Desligaram na URA')

  const filename = `relatorio-premiumsaude-semanal ${format(startOfWeek(lastWeek), 'dd-MM-yyyy')} ${format(endOfWeek(lastWeek), 'dd-MM-yyyy')}.xlsx`

  xlsx.writeFile(wb2, `./${filename}`)

  const corpo = `<p>Bom dia,<p>
    <p>Segue em anexo relatório semanal das chamadas recebidas na PremiumSaude.<p>
    <p>Atenciosamente<p>
    <p>Suporte Basix<p>`

  await enviarEmail(
    'eduardo_felipe_oliveira@yahoo.com.br',
    `Relatorio Semanal - ${format(startOfWeek(lastWeek), 'dd-MM-yyyy')} ${format(endOfWeek(lastWeek), 'dd-MM-yyyy')} - PremiumSaude`,
    corpo,
    filename
  )

  fs.unlink(`./${filename}`, () => {
    process.exit(0)
  })
}

execute()
