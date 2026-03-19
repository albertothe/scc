"use client"

import type React from "react"
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"

interface GlpiModulePageProps {
  title: string
  description: string
  glpiPath: string
  highlights: string[]
}

const GLPI_BASE_URL = (process.env.REACT_APP_GLPI_URL || "http://localhost/glpi").replace(/\/$/, "")

const GlpiModulePage: React.FC<GlpiModulePageProps> = ({ title, description, glpiPath, highlights }) => {
  const normalizedPath = glpiPath.startsWith("/") ? glpiPath : `/${glpiPath}`
  const glpiUrl = `${GLPI_BASE_URL}${normalizedPath}`

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h4">{title}</Typography>
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {highlights.map((highlight) => (
                <Chip key={highlight} label={highlight} color="primary" variant="outlined" />
              ))}
            </Stack>

            <Box>
              <Button
                variant="contained"
                endIcon={<OpenInNewIcon />}
                href={glpiUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir no GLPI
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 1, overflow: "hidden" }}>
          <Box
            component="iframe"
            src={glpiUrl}
            title={title}
            sx={{
              width: "100%",
              height: "calc(100vh - 260px)",
              minHeight: 600,
              border: 0,
              borderRadius: 1,
              backgroundColor: "background.default",
            }}
          />
        </Paper>
      </Stack>
    </Box>
  )
}

export default GlpiModulePage
