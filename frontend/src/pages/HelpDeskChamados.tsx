"use client"

import type React from "react"
import GlpiModulePage from "../components/GlpiModulePage"

const HelpDeskChamados: React.FC = () => {
  return (
    <GlpiModulePage
      title="Help Desk - Chamados"
      description="Central de atendimento integrada ao GLPI para abertura, acompanhamento e atualização de chamados do suporte técnico."
      glpiPath="/front/ticket.php"
      highlights={[
        "Abertura de chamados",
        "Acompanhamento de status",
        "Histórico de atendimento",
        "Base GLPI",
      ]}
    />
  )
}

export default HelpDeskChamados
