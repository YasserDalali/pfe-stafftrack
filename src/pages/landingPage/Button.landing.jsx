import React from 'react'
import { Link } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
function ButtonLanding({content = "Get started", className }) {
  return (
    <Link pathname="/admin/" className={twMerge("bg-teal-500/20 px-4 py-2 border-teal-500 border rounded-lg hover:shadow-md hover:shadow-teal-500/50 transition-all hover:scale-105 font-semibold", className)}>{content}</Link>
  )
}

export default ButtonLanding