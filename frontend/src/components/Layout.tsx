"use client"

import React from "react"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import {
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Box,
  Divider,
  Tooltip,
  Avatar,
  Collapse,
} from "@mui/material"
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LocalShipping,
  Label,
  ExitToApp,
  LocalOffer,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AttachMoney,
  ExpandLess,
  ExpandMore,
  BarChart,
  Home as HomeIcon,
  Person as PersonIcon,
  AccountBalance as ControladoriaIcon, // Ícone para Controladoria
  ShoppingCart as AutorizacaoIcon, // Ícone para Autorização Compra
} from "@mui/icons-material"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useThemeMode } from "../contexts/ThemeContext"

interface LayoutProps {
  children: ReactNode
}

interface MenuItem {
  text: string
  icon: React.ReactNode
  path?: string
  subItems: SubMenuItem[]
}

interface SubMenuItem {
  text: string
  icon: React.ReactNode
  path: string
}

const DRAWER_WIDTH = 240
const MINI_DRAWER_WIDTH = 65

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const location = useLocation()
  const { logout, isAuthenticated, usuario } = useAuth()
  const { darkMode, toggleDarkMode } = useThemeMode()
  const navigate = useNavigate()

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/login") {
      navigate("/login")
    }
  }, [isAuthenticated, location.pathname, navigate])

  // Carregar preferência do usuário do localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem("menuCollapsed")
    if (savedPreference !== null) {
      setMenuCollapsed(savedPreference === "true")
    }
  }, [])

  // Salvar preferência do usuário no localStorage
  useEffect(() => {
    localStorage.setItem("menuCollapsed", String(menuCollapsed))
  }, [menuCollapsed])

  // Carregar estado de expansão dos menus do localStorage
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem("expandedMenus")
    if (savedExpandedMenus !== null) {
      setExpandedMenus(JSON.parse(savedExpandedMenus))
    }
  }, [])

  // Modificar a estrutura de dados do menu para incluir Home e submenus
  const menuItems: MenuItem[] = [
    {
      text: "Home",
      icon: <HomeIcon />,
      path: "/home",
      subItems: [],
    },
    {
      text: "Cadastros",
      icon: <LocalShipping />,
      subItems: [
        { text: "Produtos Enco-Fora", icon: <LocalShipping />, path: "/produtos-fora" },
        { text: "Produtos Etiquetas", icon: <Label />, path: "/produtos-etiquetas" },
        { text: "Produtos Promoção", icon: <LocalOffer />, path: "/promocao" },
      ],
    },
    {
      text: "Comissões",
      icon: <AttachMoney />,
      subItems: [
        { text: "Faixas de Comissão", icon: <BarChart />, path: "/comissao/faixas" },
        { text: "Metas Vendedores", icon: <PersonIcon />, path: "/comissao/metas" },
        { text: "Comissões Vendedores", icon: <AttachMoney />, path: "/comissao/vendedores" },
      ],
    },
    {
      text: "Controladoria",
      icon: <ControladoriaIcon />,
      subItems: [{ text: "Autorização Compra", icon: <AutorizacaoIcon />, path: "/controladoria/autorizacao-compra" }],
    },
  ]

  // Estado para controlar quais menus estão expandidos
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  // Salvar estado de expansão dos menus no localStorage
  useEffect(() => {
    localStorage.setItem("expandedMenus", JSON.stringify(expandedMenus))
  }, [expandedMenus])

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const toggleMenu = () => {
    setMenuCollapsed(!menuCollapsed)
  }

  const handleLogout = () => {
    logout()
  }

  // Função para alternar a expansão de um menu
  const toggleSubMenu = (menuText: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuText]: !prev[menuText],
    }))
  }

  // Verificar se um item de menu deve mostrar seus subitens
  const shouldShowSubItems = (menuText: string) => {
    return !menuCollapsed && expandedMenus[menuText]
  }

  // Verificar se um caminho está ativo
  const isPathActive = (path: string | undefined) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  // Verificar se algum subitem está ativo
  const hasActiveSubItem = (subItems: SubMenuItem[]) => {
    return subItems.some((item) => isPathActive(item.path))
  }

  const drawer = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: menuCollapsed ? "column" : "row",
          justifyContent: menuCollapsed ? "flex-start" : "space-between",
          alignItems: "center",
          backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : theme.palette.primary.main,
          color: theme.palette.mode === "dark" ? theme.palette.text.primary : "white",
          py: menuCollapsed ? 1 : 0,
          minHeight: menuCollapsed ? "auto" : 64,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: menuCollapsed ? "center" : "flex-start",
            mb: menuCollapsed ? 1 : 0,
          }}
        >
          <Typography
            variant={menuCollapsed ? "subtitle1" : "h6"}
            noWrap
            component="div"
            sx={{
              textAlign: menuCollapsed ? "center" : "left",
              fontSize: menuCollapsed ? "1rem" : "1.25rem",
            }}
          >
            {menuCollapsed ? "JM" : "J Monte"}
          </Typography>
        </Box>

        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              flexDirection: menuCollapsed ? "column" : "row",
              width: menuCollapsed ? "100%" : "auto",
            }}
          >
            <IconButton onClick={toggleMenu} sx={{ color: "white" }}>
              {menuCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
        )}
      </Toolbar>
      <Divider />

      <List sx={{ backgroundColor: theme.palette.mode === "dark" ? "background.paper" : "#f5f5f5", flexGrow: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {/* Item principal do menu */}
            <Tooltip title={menuCollapsed ? item.text : ""} placement="right">
              <ListItem
                button
                component={item.subItems.length === 0 && item.path ? Link : "div"}
                to={item.subItems.length === 0 && item.path ? item.path : undefined}
                onClick={item.subItems.length > 0 ? () => toggleSubMenu(item.text) : undefined}
                sx={{
                  minHeight: 48,
                  justifyContent: menuCollapsed ? "center" : "initial",
                  px: 2.5,
                  backgroundColor:
                    (isPathActive(item.path) || hasActiveSubItem(item.subItems)) && theme.palette.mode === "dark"
                      ? "rgba(144, 202, 249, 0.08)"
                      : isPathActive(item.path) || hasActiveSubItem(item.subItems)
                        ? "#e3f2fd"
                        : "transparent",
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(144, 202, 249, 0.08)" : "#bbdefb",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: menuCollapsed ? "auto" : 3,
                    justifyContent: "center",
                    color:
                      isPathActive(item.path) || hasActiveSubItem(item.subItems)
                        ? theme.palette.primary.main
                        : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {!menuCollapsed && (
                  <>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        color:
                          isPathActive(item.path) || hasActiveSubItem(item.subItems)
                            ? theme.palette.primary.main
                            : "inherit",
                      }}
                    />
                    {item.subItems &&
                      item.subItems.length > 0 &&
                      (expandedMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                  </>
                )}
              </ListItem>
            </Tooltip>

            {/* Subitens - só aparecem quando o menu está expandido e o item pai está expandido */}
            {item.subItems && item.subItems.length > 0 && (
              <Collapse in={shouldShowSubItems(item.text)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem
                      button
                      component={Link}
                      to={subItem.path}
                      key={subItem.text}
                      selected={isPathActive(subItem.path)}
                      onClick={isMobile ? toggleDrawer : undefined}
                      sx={{
                        pl: 4,
                        minHeight: 40,
                        backgroundColor: isPathActive(subItem.path)
                          ? theme.palette.mode === "dark"
                            ? "rgba(144, 202, 249, 0.16)"
                            : "#e3f2fd"
                          : "transparent",
                        "&:hover": {
                          backgroundColor: theme.palette.mode === "dark" ? "rgba(144, 202, 249, 0.08)" : "#bbdefb",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: 3,
                          justifyContent: "center",
                          color: isPathActive(subItem.path) ? theme.palette.primary.main : "inherit",
                        }}
                      >
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={subItem.text}
                        primaryTypographyProps={{
                          variant: "body2",
                          sx: {
                            fontSize: "0.875rem",
                            color: isPathActive(subItem.path) ? theme.palette.primary.main : "inherit",
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>

      <Divider />
      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#f5f5f5",
          display: "flex",
          flexDirection: menuCollapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: menuCollapsed ? "center" : "space-between",
          gap: menuCollapsed ? 2 : 0,
        }}
      >
        {menuCollapsed ? (
          // Layout vertical quando o menu está recolhido
          <>
            <Avatar
              sx={{
                bgcolor: "#1976d2",
                width: 32,
                height: 32,
              }}
            >
              {usuario?.usuario ? usuario.usuario.charAt(0) : "U"}
            </Avatar>
            <Tooltip title="Alternar tema" placement="right">
              <IconButton onClick={toggleDarkMode} size="small">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </>
        ) : (
          // Layout horizontal quando o menu está expandido
          <>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "#1976d2",
                  width: 32,
                  height: 32,
                  mr: 1.5,
                }}
              >
                {usuario?.usuario ? usuario.usuario.charAt(0) : "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" noWrap>
                  {usuario?.usuario || "Usuário"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {usuario?.codusuario || ""} - Nível: {usuario?.nivel || ""}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Alternar tema">
              <IconButton onClick={toggleDarkMode} size="small">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      <List sx={{ backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#f5f5f5" }}>
        <Tooltip title={menuCollapsed ? "Sair" : ""} placement="right">
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              justifyContent: menuCollapsed ? "center" : "initial",
              px: 2.5,
              "&:hover": {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.16)" : "#ffcdd2",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: menuCollapsed ? "auto" : 3,
                justifyContent: "center",
                color: "#d32f2f", // Ícone vermelho
              }}
            >
              <ExitToApp />
            </ListItemIcon>
            {!menuCollapsed && <ListItemText primary="Sair" sx={{ color: "#d32f2f" }} />}
          </ListItem>
        </Tooltip>
      </List>
    </>
  )

  // Se não estiver autenticado, não renderizar o layout
  if (!isAuthenticated && location.pathname !== "/login") {
    return null
  }

  // Se estiver na página de login, renderizar apenas o conteúdo sem o layout
  if (location.pathname === "/login") {
    return <>{children}</>
  }

  return (
    <Box sx={{ display: "flex" }}>
      {isMobile ? (
        <>
          <IconButton
            color="primary"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ position: "fixed", top: 10, left: 10, zIndex: 1300, bgcolor: "white" }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="primary"
            aria-label="toggle theme"
            onClick={toggleDarkMode}
            sx={{ position: "fixed", top: 10, right: 10, zIndex: 1300, bgcolor: "white" }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={toggleDrawer}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
        </>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: menuCollapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: menuCollapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${menuCollapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          marginLeft: isMobile ? 0 : "auto",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout
