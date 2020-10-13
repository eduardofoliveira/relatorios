require('dotenv').config()
const { startOfMonth, endOfMonth, format, subMonths } = require('date-fns')
const xlsx = require('xlsx')
const fs = require('fs')

const { enviarEmail } = require('./service/mail')
const CallCountRepository = require('./repository/callCountRepository')

const today = new Date()

const execute = async () => {
  lastMonth = subMonths(today, 1)
  let startMonth = format(startOfMonth(lastMonth), 'dd-MM-yyyy HH:mm:ss')
  let endMonth = format(endOfMonth(lastMonth), 'dd-MM-yyyy HH:mm:ss')

  const callCountRepository = new CallCountRepository()
  const resultMonth = await callCountRepository.showByDomain({
    domain: 'premiumsaude.cloudcom.com.br',
    start: startMonth,
    end: endMonth
  })

  const mensal = xlsx.utils.json_to_sheet(resultMonth)

  const wb1 = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb1, mensal, 'Mensal')

  const filename = `relatorio-premiumsaude-mensal ${format(startOfMonth(lastMonth), 'MM-yyyy')}.xlsx`

  xlsx.writeFile(wb1, `./${filename}`)

  const corpo = `<p>Bom dia,<p>
    <p>Segue em anexo relatório mensal das chamadas recebidas na PremiumSaude.<p>
    <p>Atenciosamente<p>
    <p>Suporte Basix<p>`

  await enviarEmail(
    'eduardo_felipe_oliveira@yahoo.com.br',
    `Relatorio Mensal - ${format(startOfMonth(lastMonth), 'MM-yyyy')} - PremiumSaude`,
    corpo,
    filename
  )

  fs.unlink(`./${filename}`, () => {
    process.exit(0)
  })
}

execute()