import { InterviewDataProvider } from '@/context/InterviewData'
import React from 'react'

function InterviewLayout({ children }) {
    return (
        <InterviewDataProvider>
            <div>
                {children}
            </div>
        </InterviewDataProvider>
    )
}

export default InterviewLayout