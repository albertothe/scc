import { Box, Typography } from "@mui/material"
import { TableChart as DreF360Icon } from "@mui/icons-material"

export default function DreF360() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
      <DreF360Icon sx={{ fontSize: 64, color: "text.disabled" }} />
      <Typography variant="h5" fontWeight={700} color="text.secondary">
        DRE F360
      </Typography>
      <Typography variant="body2" color="text.disabled">
        Módulo em desenvolvimento.
      </Typography>
    </Box>
  )
}
