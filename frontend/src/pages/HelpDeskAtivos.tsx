"use client"

import type React from "react"
import GlpiModulePage from "../components/GlpiModulePage"

const HelpDeskAtivos: React.FC = () => {
  return (
    <GlpiModulePage
      title="Help Desk - Ativos"
      description="Área de cadastro e consulta de computadores no GLPI, permitindo gerenciar inventário, identificação e informações dos equipamentos."
      glpiPath="/front/computer.php"
      highlights={[
        "Cadastro de computadores",
        "Inventário de ativos",
        "Consulta de equipamentos",
        "Base GLPI",
      ]}
    />
  )
}

export default HelpDeskAtivos
