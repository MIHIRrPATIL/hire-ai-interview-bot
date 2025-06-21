import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import AppSidebar from './_components/AppSidebar'

function DashboardProvider({ children }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="relative">
                    <div className="absolute top-4 left-4 z-10">
                        <SidebarTrigger className="h-10 w-10 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 flex items-center justify-center group">
                            <svg 
                                className="h-4 w-4 text-gray-600 group-hover:text-gray-900 transition-colors" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M4 6h16M4 12h16M4 18h16" 
                                />
                            </svg>
                        </SidebarTrigger>
                    </div>
                    <div className="pt-16">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default DashboardProvider