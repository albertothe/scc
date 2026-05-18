"use client"

import React from "react"
import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import {
    AppBar,
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
    AccountBalance as ControladoriaIcon,
    ShoppingCart as AutorizacaoIcon,
    Security as AcessoIcon,
    Settings as ModulosIcon,
    People as NiveisIcon,
    VpnKey as PermissoesIcon,
    TableChart as DreIcon,
    SupportAgent as HelpDeskIcon,
    ShoppingBasket as CompradoresIcon,
    ConfirmationNumber as ChamadosIcon,
    Computer as AtivosIcon,
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

const DRAWER_WIDTH = 248
const MINI_DRAWER_WIDTH = 64

// Sidebar sempre escura, independente do tema da aplicação
const SB = {
    bg: "#0F172A",
    headerBg: "#1E293B",
    text: "#94A3B8",
    textHover: "#CBD5E1",
    textActive: "#FFFFFF",
    iconActive: "#EF9A9A",
    activeBg: "rgba(139, 0, 0, 0.12)",
    activeBorder: "#B71C1C",
    hoverBg: "rgba(255,255,255,0.04)",
    divider: "rgba(255,255,255,0.07)",
    subText: "#64748B",
    subTextActive: "#FFCDD2",
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [menuCollapsed, setMenuCollapsed] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("md"))
    const location = useLocation()
    const { logout, isAuthenticated, usuario } = useAuth()
    const { darkMode, toggleDarkMode } = useThemeMode()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isAuthenticated && location.pathname !== "/login") navigate("/login")
    }, [isAuthenticated, location.pathname, navigate])

    useEffect(() => {
        const v = localStorage.getItem("menuCollapsed")
        if (v !== null) setMenuCollapsed(v === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("menuCollapsed", String(menuCollapsed))
    }, [menuCollapsed])

    useEffect(() => {
        const v = localStorage.getItem("expandedMenus")
        if (v !== null) setExpandedMenus(JSON.parse(v))
    }, [])

    useEffect(() => {
        localStorage.setItem("expandedMenus", JSON.stringify(expandedMenus))
    }, [expandedMenus])

    const menuItems: MenuItem[] = [
        { text: "Home", icon: <HomeIcon />, path: "/home", subItems: [] },
        {
            text: "Cadastros",
            icon: <LocalShipping />,
            subItems: [
                { text: "Produtos Enco-Fora", icon: <LocalShipping />, path: "/produtos-fora" },
                { text: "Produtos Etiquetas", icon: <Label />, path: "/produtos-etiquetas" },
                { text: "Produtos Promoção", icon: <LocalOffer />, path: "/promocao" },
                { text: "Produtos Facing", icon: <LocalOffer />, path: "/produtos-facing" },
            ],
        },
        {
            text: "Comissões",
            icon: <AttachMoney />,
            subItems: [
                { text: "Faixas de Comissão", icon: <BarChart />, path: "/comissao/faixas" },
                { text: "Metas Vendedores", icon: <PersonIcon />, path: "/comissao/metas" },
                { text: "Comissão Vendedores", icon: <PersonIcon />, path: "/comissao/vendedores" },
            ],
        },
        {
            text: "Compradores",
            icon: <CompradoresIcon />,
            subItems: [
                { text: "Compradores", icon: <PersonIcon />, path: "/compradores" },
                { text: "Grupos", icon: <BarChart />, path: "/compradores/grupos" },
                { text: "Metas", icon: <AttachMoney />, path: "/compradores/metas" },
            ],
        },
        {
            text: "Controladoria",
            icon: <ControladoriaIcon />,
            subItems: [
                { text: "Autorização Compra", icon: <AutorizacaoIcon />, path: "/controladoria/autorizacao-compra" },
                { text: "DRE", icon: <DreIcon />, path: "/controladoria/dre" },
                { text: "DRE F360", icon: <DreIcon />, path: "/controladoria/dre-f360" },
            ],
        },
        {
            text: "Help Desk",
            icon: <HelpDeskIcon />,
            subItems: [
                { text: "Chamados", icon: <ChamadosIcon />, path: "/help-desk/chamados" },
                { text: "Ativos", icon: <AtivosIcon />, path: "/help-desk/ativos" },
            ],
        },
        {
            text: "Controle de Acesso",
            icon: <AcessoIcon />,
            subItems: [
                { text: "Módulos", icon: <ModulosIcon />, path: "/controle-acesso/modulos" },
                { text: "Níveis", icon: <NiveisIcon />, path: "/controle-acesso/niveis" },
                { text: "Permissões", icon: <PermissoesIcon />, path: "/controle-acesso/permissoes" },
            ],
        },
    ]

    const toggleDrawer = () => setDrawerOpen(!drawerOpen)
    const toggleMenu = () => setMenuCollapsed(!menuCollapsed)
    const toggleSubMenu = (text: string) =>
        setExpandedMenus((prev) => ({ ...prev, [text]: !prev[text] }))

    const isPathActive = (path?: string) => {
        if (!path) return false
        return location.pathname === path || location.pathname.startsWith(`${path}/`)
    }

    const hasActiveSubItem = (subItems: SubMenuItem[]) =>
        subItems.some((s) => isPathActive(s.path))

    // ── Logotipo da sidebar ──
    const LogoBox = (
        <Box sx={{
            width: 32, height: 32,
            borderRadius: "8px",
            background: "linear-gradient(135deg, #7B0000, #B71C1C)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(139,0,0,0.4)",
        }}>
            <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.02em" }}>
                JM
            </Typography>
        </Box>
    )

    // ── Conteúdo da sidebar ──
    const sidebarContent = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Cabeçalho */}
            <Box sx={{
                px: menuCollapsed ? 1.5 : 2.5,
                py: 0,
                minHeight: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: menuCollapsed ? "center" : "space-between",
                background: SB.headerBg,
                borderBottom: `1px solid ${SB.divider}`,
                flexShrink: 0,
            }}>
                {menuCollapsed ? (
                    LogoBox
                ) : (
                    <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            {LogoBox}
                            <Typography sx={{
                                color: "white",
                                fontWeight: 700,
                                fontSize: "1rem",
                                letterSpacing: "-0.01em",
                            }}>
                                J Monte
                            </Typography>
                        </Box>
                        {!isMobile && (
                            <IconButton
                                onClick={toggleMenu}
                                size="small"
                                sx={{ color: SB.text, "&:hover": { color: "white", background: SB.hoverBg } }}
                            >
                                <ChevronLeftIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </>
                )}
                {menuCollapsed && !isMobile && (
                    <Box sx={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)" }} />
                )}
            </Box>

            {/* Botão de expandir quando collapsed */}
            {menuCollapsed && !isMobile && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1, borderBottom: `1px solid ${SB.divider}` }}>
                    <IconButton
                        onClick={toggleMenu}
                        size="small"
                        sx={{ color: SB.text, "&:hover": { color: "white", background: SB.hoverBg } }}
                    >
                        <ChevronRightIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            )}

            {/* Itens de menu */}
            <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.5,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": { background: SB.divider, borderRadius: 2 },
            }}>
                {menuItems.map((item) => {
                    const isActive = isPathActive(item.path) || hasActiveSubItem(item.subItems)
                    const isExpanded = !menuCollapsed && expandedMenus[item.text]

                    return (
                        <React.Fragment key={item.text}>
                            <Tooltip
                                title={menuCollapsed ? item.text : ""}
                                placement="right"
                                arrow
                            >
                                <ListItem
                                    button
                                    component={item.subItems.length === 0 && item.path ? Link : "div"}
                                    to={item.subItems.length === 0 && item.path ? item.path : undefined}
                                    onClick={item.subItems.length > 0 ? () => toggleSubMenu(item.text) : undefined}
                                    sx={{
                                        mx: 1,
                                        mb: 0.25,
                                        borderRadius: "8px",
                                        minHeight: 42,
                                        px: menuCollapsed ? 1.5 : 1.5,
                                        justifyContent: menuCollapsed ? "center" : "flex-start",
                                        position: "relative",
                                        overflow: "hidden",
                                        background: isActive ? SB.activeBg : "transparent",
                                        "&:hover": {
                                            background: isActive ? SB.activeBg : SB.hoverBg,
                                        },
                                        // Borda esquerda ativa
                                        "&::before": isActive ? {
                                            content: '""',
                                            position: "absolute",
                                            left: 0,
                                            top: "18%",
                                            height: "64%",
                                            width: 3,
                                            borderRadius: "0 3px 3px 0",
                                            background: SB.activeBorder,
                                        } : {},
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        minWidth: 0,
                                        mr: menuCollapsed ? "auto" : 1.5,
                                        justifyContent: "center",
                                        color: isActive ? SB.iconActive : SB.text,
                                        "& svg": { fontSize: "1.2rem" },
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>

                                    {!menuCollapsed && (
                                        <>
                                            <ListItemText
                                                primary={item.text}
                                                primaryTypographyProps={{
                                                    sx: {
                                                        fontSize: "0.875rem",
                                                        fontWeight: isActive ? 600 : 500,
                                                        color: isActive ? SB.textActive : SB.text,
                                                    },
                                                }}
                                            />
                                            {item.subItems.length > 0 && (
                                                isExpanded
                                                    ? <ExpandLess sx={{ color: SB.text, fontSize: 18 }} />
                                                    : <ExpandMore sx={{ color: SB.text, fontSize: 18 }} />
                                            )}
                                        </>
                                    )}
                                </ListItem>
                            </Tooltip>

                            {/* Sub-itens */}
                            {item.subItems.length > 0 && (
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <List disablePadding sx={{ mb: 0.5 }}>
                                        {item.subItems.map((sub) => {
                                            const subActive = isPathActive(sub.path)
                                            return (
                                                <ListItem
                                                    button
                                                    component={Link}
                                                    to={sub.path}
                                                    key={sub.text}
                                                    onClick={isMobile ? toggleDrawer : undefined}
                                                    sx={{
                                                        mx: 1,
                                                        mb: 0.25,
                                                        borderRadius: "8px",
                                                        minHeight: 36,
                                                        pl: 4,
                                                        pr: 1.5,
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        background: subActive ? "rgba(139, 0, 0, 0.08)" : "transparent",
                                                        "&:hover": {
                                                            background: subActive
                                                                ? "rgba(139, 0, 0, 0.12)"
                                                                : SB.hoverBg,
                                                        },
                                                        "&::before": subActive ? {
                                                            content: '""',
                                                            position: "absolute",
                                                            left: 0,
                                                            top: "18%",
                                                            height: "64%",
                                                            width: 2,
                                                            borderRadius: "0 2px 2px 0",
                                                            background: SB.activeBorder,
                                                        } : {},
                                                    }}
                                                >
                                                    <ListItemIcon sx={{
                                                        minWidth: 0,
                                                        mr: 1.5,
                                                        color: subActive ? SB.subTextActive : SB.subText,
                                                        "& svg": { fontSize: "1rem" },
                                                    }}>
                                                        {sub.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={sub.text}
                                                        primaryTypographyProps={{
                                                            sx: {
                                                                fontSize: "0.8125rem",
                                                                fontWeight: subActive ? 600 : 400,
                                                                color: subActive ? SB.subTextActive : SB.subText,
                                                            },
                                                        }}
                                                    />
                                                </ListItem>
                                            )
                                        })}
                                    </List>
                                </Collapse>
                            )}
                        </React.Fragment>
                    )
                })}
            </Box>

            {/* Rodapé — usuário + tema + sair */}
            <Box sx={{ flexShrink: 0 }}>
                <Divider sx={{ borderColor: SB.divider }} />

                {/* Info do usuário */}
                <Box sx={{
                    px: menuCollapsed ? 1 : 2,
                    py: 1.5,
                    background: SB.headerBg,
                    display: "flex",
                    flexDirection: menuCollapsed ? "column" : "row",
                    alignItems: "center",
                    gap: menuCollapsed ? 1 : 0,
                    justifyContent: menuCollapsed ? "center" : "space-between",
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, overflow: "hidden" }}>
                        <Avatar sx={{
                            width: 32, height: 32,
                            background: "linear-gradient(135deg, #7B0000, #B71C1C)",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            {usuario?.usuario?.charAt(0) ?? "U"}
                        </Avatar>
                        {!menuCollapsed && (
                            <Box sx={{ overflow: "hidden" }}>
                                <Typography noWrap sx={{
                                    color: SB.textHover,
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    lineHeight: 1.3,
                                }}>
                                    {usuario?.usuario ?? "Usuário"}
                                </Typography>
                                <Typography noWrap sx={{
                                    color: SB.subText,
                                    fontSize: "0.7rem",
                                    lineHeight: 1.3,
                                }}>
                                    Nível {usuario?.nivel ?? "—"}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Tooltip title="Alternar tema" placement="right">
                        <IconButton
                            onClick={toggleDarkMode}
                            size="small"
                            sx={{ color: SB.text, "&:hover": { color: "white", background: SB.hoverBg } }}
                        >
                            {darkMode ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                    </Tooltip>
                </Box>

                <Divider sx={{ borderColor: SB.divider }} />

                {/* Botão sair */}
                <Tooltip title={menuCollapsed ? "Sair" : ""} placement="right">
                    <ListItem
                        button
                        onClick={logout}
                        sx={{
                            mx: 1,
                            my: 0.75,
                            borderRadius: "8px",
                            minHeight: 40,
                            px: 1.5,
                            justifyContent: menuCollapsed ? "center" : "flex-start",
                            "&:hover": { background: "rgba(239, 68, 68, 0.1)" },
                        }}
                    >
                        <ListItemIcon sx={{
                            minWidth: 0,
                            mr: menuCollapsed ? "auto" : 1.5,
                            color: "#EF4444",
                            "& svg": { fontSize: "1.15rem" },
                        }}>
                            <ExitToApp />
                        </ListItemIcon>
                        {!menuCollapsed && (
                            <ListItemText
                                primary="Sair"
                                primaryTypographyProps={{
                                    sx: { fontSize: "0.875rem", fontWeight: 500, color: "#EF4444" },
                                }}
                            />
                        )}
                    </ListItem>
                </Tooltip>
            </Box>
        </Box>
    )

    // ── Guard: não renderizar layout fora das rotas autenticadas ──
    if (!isAuthenticated && location.pathname !== "/login") return null
    if (location.pathname === "/login") return <>{children}</>

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>

            {/* ── Mobile: AppBar no topo ── */}
            {isMobile && (
                <>
                    <AppBar
                        position="fixed"
                        className="no-print"
                        elevation={0}
                        sx={{
                            background: SB.bg,
                            borderBottom: `1px solid ${SB.divider}`,
                            zIndex: theme.zIndex.drawer + 1,
                        }}
                    >
                        <Toolbar sx={{ gap: 1 }}>
                            <IconButton
                                onClick={toggleDrawer}
                                size="small"
                                sx={{ color: SB.text, "&:hover": { color: "white" } }}
                            >
                                <MenuIcon />
                            </IconButton>
                            {LogoBox}
                            <Typography sx={{ color: "white", fontWeight: 700, fontSize: "1rem", flex: 1, ml: 0.5 }}>
                                J Monte
                            </Typography>
                            <IconButton
                                onClick={toggleDarkMode}
                                size="small"
                                sx={{ color: SB.text, "&:hover": { color: "white" } }}
                            >
                                {darkMode ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
                            </IconButton>
                        </Toolbar>
                    </AppBar>

                    <Drawer
                        className="no-print"
                        variant="temporary"
                        open={drawerOpen}
                        onClose={toggleDrawer}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            "& .MuiDrawer-paper": {
                                width: DRAWER_WIDTH,
                                background: SB.bg,
                                border: "none",
                                boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
                            },
                        }}
                    >
                        {sidebarContent}
                    </Drawer>
                </>
            )}

            {/* ── Desktop: Drawer permanente ── */}
            {!isMobile && (
                <Drawer
                    className="no-print"
                    variant="permanent"
                    sx={{
                        width: menuCollapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
                        flexShrink: 0,
                        "& .MuiDrawer-paper": {
                            width: menuCollapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
                            background: SB.bg,
                            border: "none",
                            boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
                            overflowX: "hidden",
                            transition: theme.transitions.create("width", {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>
            )}

            {/* ── Área de conteúdo principal ── */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    pt: { xs: 10, md: 3 }, // espaço para AppBar no mobile
                    minHeight: "100vh",
                    background: theme.palette.background.default,
                    transition: theme.transitions.create(["margin", "width"], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: "hidden",
                }}
            >
                {children}
            </Box>
        </Box>
    )
}

export default Layout
