const { connection } = require('../database/connection');

class callCountRepository {
  async showByDomain({ domain, start, end }) {
    const status = await connection.raw(`
      select
        vch_to as did,
        count(*) as quantidade
      from
        tbl_pbx_systemcalllog
      where
        dtm_starttime BETWEEN TO_DATE('${start}','DD-MM-YYYY HH24:MI:SS') and TO_DATE('${end}','DD-MM-YYYY HH24:MI:SS') and
        vch_to in (
          select
            a.vch_address
          from
            tbl_pbx_address a,
            tbl_sys_domain d
          where
            a.int_domain_key = d.int_domain_key and
            d.vch_domain = '${domain}' and
            a.int_type = 3 and
            a.int_active != 0 ) and
        int_connectionsequence = 1
      group by
        vch_to
      order by
        vch_to
    `)

    return status
  }

  async showCallDetailByDomain({ domain, start, end }) {
    const status = {}

    const callsDetail = await connection.raw(`
      select
        vch_callid,
        vch_to as did,
        TO_CHAR(dtm_starttime,'DD-MM-YYYY HH24:MI:SS') as inicio,
        TO_CHAR(dtm_endtime,'DD-MM-YYYY HH24:MI:SS') as termino
      from
        tbl_pbx_systemcalllog
      where
        dtm_starttime BETWEEN TO_DATE('${start}','DD-MM-YYYY HH24:MI:SS') and TO_DATE('${end}','DD-MM-YYYY HH24:MI:SS') and
        vch_to in (
          select
            a.vch_address
          from
            tbl_pbx_address a,
            tbl_sys_domain d
          where
            a.int_domain_key = d.int_domain_key and
            d.vch_domain = '${domain}' and
            a.int_type = 3 and
            a.int_active != 0 ) and
        int_connectionsequence = 1
      order by
        dtm_starttime
  `)

    if(callsDetail.length === 0){
      return callsDetail
    }

    for (let i = 0; i < callsDetail.length; i++) {
      const { VCH_CALLID, DID, INICIO, TERMINO } = callsDetail[i];

      //console.log({ VCH_CALLID, DID, INICIO, TERMINO })

      const [{INT_CONNECTIONSEQUENCE, VCH_TO, VCH_TARGET}, penultimo] = await connection.raw(`
        select
          *
        from
          tbl_pbx_systemcalllog
        where
          vch_callid = '${VCH_CALLID}'
        order by
          int_connectionsequence
        desc
      `)

      if(VCH_TO === 'Transbordo' && INT_CONNECTIONSEQUENCE === 2){
        if(status[`transbordo-${DID}`] === undefined){
          status[`transbordo-${DID}`] = 1
        }

        status[`transbordo-${DID}`] = status[`transbordo-${DID}`] + 1

        // console.log(`Transbordada transbordo-${DID} ${status[`transbordo-${DID}`]}`)
      }else if(VCH_TARGET === 'Transbordo' && INT_CONNECTIONSEQUENCE === 1){
        if(status[`transbordo-${DID}`] === undefined){
          status[`transbordo-${DID}`] = 1
        }

        status[`transbordo-${DID}`] = status[`transbordo-${DID}`] + 1

        // console.log(`Transbordada transbordo-${DID} ${status[`transbordo-${DID}`]}`)
      }else if(VCH_TO === 'acdGroupServer'){
        if(status[`${VCH_TARGET}-${DID}`] === undefined){
          status[`${VCH_TARGET}-${DID}`] = 1
        }

        status[`${VCH_TARGET}-${DID}`] = status[`${VCH_TARGET}-${DID}`] + 1

        // console.log(`Chamada CallCenter ${VCH_TARGET}-${DID}: ${status[`${VCH_TARGET}-${DID}`]}`)
      }else{
        if(DID === VCH_TARGET){
          console.log({VCH_CALLID, DID, INT_CONNECTIONSEQUENCE, VCH_TO, VCH_TARGET})
          console.log(penultimo)
          console.log('')
        }

        if(status[`${VCH_TARGET}-${DID}`] === undefined){
          status[`${VCH_TARGET}-${DID}`] = 1
        }

        status[`${VCH_TARGET}-${DID}`] = status[`${VCH_TARGET}-${DID}`] + 1

        // console.log(`Chamada Fora do CallCenter ${VCH_TARGET}-${DID}: ${status[`${VCH_TARGET}-${DID}`]}`)
      }
    }

    return status
  }
}

module.exports = callCountRepository
