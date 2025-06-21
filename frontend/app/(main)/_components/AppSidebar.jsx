'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { LogOut } from "lucide-react"
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../../services/supabaseClient'
import { SIDEBAR_NAVIGATION, SIDEBAR_CTA } from '../../../services/constants'
import { cn } from '../../../lib/utils'

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const isActiveRoute = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar className="border-r border-gray-100 bg-white/80 backdrop-blur-xl">
      <SidebarHeader className="border-b border-gray-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg">
            <Image src="/favicon.ico" alt="AI Interview Logo" width={24} height={24} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">AI Interview</h2>
            <p className="text-xs text-gray-500 font-medium">Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarMenu className="space-y-1">
          {/* CTA Button */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm border-0"
            >
              <a href={SIDEBAR_CTA.href} className="flex items-center justify-center gap-2.5">
                <SIDEBAR_CTA.icon className="h-4 w-4" />
                <span>{SIDEBAR_CTA.label}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="h-6" />

          {/* Main Navigation */}
          <SidebarGroup className="space-y-3">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              Main
            </SidebarGroupLabel>
            <div className="space-y-1">
              {SIDEBAR_NAVIGATION.slice(0, 4).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActiveRoute(item.href)}
                    className={cn(
                      "h-9 rounded-lg px-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50",
                      isActiveRoute(item.href) 
                        ? "bg-blue-50 text-blue-700 shadow-sm border-l-2 border-blue-500 hover:bg-blue-100" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <a href={item.href} className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActiveRoute(item.href) ? "text-blue-600" : "text-gray-400"
                      )} />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </SidebarGroup>
          
          <div className="h-6" />
          
          {/* Analytics */}
          <SidebarGroup className="space-y-3">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              Analytics
            </SidebarGroupLabel>
            <div className="space-y-1">
              {SIDEBAR_NAVIGATION.slice(4, 6).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActiveRoute(item.href)}
                    className={cn(
                      "h-9 rounded-lg px-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50",
                      isActiveRoute(item.href) 
                        ? "bg-blue-50 text-blue-700 shadow-sm border-l-2 border-blue-500 hover:bg-blue-100" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <a href={item.href} className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActiveRoute(item.href) ? "text-blue-600" : "text-gray-400"
                      )} />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </SidebarGroup>
          
          <div className="h-6" />
          
          {/* Settings */}
          <SidebarGroup className="space-y-3">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              Settings
            </SidebarGroupLabel>
            <div className="space-y-1">
              {SIDEBAR_NAVIGATION.slice(6).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActiveRoute(item.href)}
                    className={cn(
                      "h-9 rounded-lg px-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50",
                      isActiveRoute(item.href) 
                        ? "bg-blue-50 text-blue-700 shadow-sm border-l-2 border-blue-500 hover:bg-blue-100" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <a href={item.href} className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActiveRoute(item.href) ? "text-blue-600" : "text-gray-400"
                      )} />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="h-9 rounded-lg px-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}