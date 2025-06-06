import React from 'react'
import { Box, Toolbar, useMediaQuery } from '@mui/material'
import Sidebar from './sidebar'
import Content from './content'
import Footer from './footer'

function Main() {
  const matches = useMediaQuery('(min-width:900px)')

  return (
    <Box sx={{ display: 'flex', height: "100%", width: "100%" }}>
      {/* <Sidebar /> */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          // width: !matches ? "100%" : `calc(100% - ${240}px)`,
          display: "flex",
          flexDirection: "column",
          // backgroundColor: "#0D1117"
        }}
      >
        {/* <Toolbar /> */}
        <Content />
        <Footer
          title={
            null
            // <img src='./wke_ani.gif' alt="wke logo" className='footer-logo' />
          }
        />
      </Box>
    </Box>
  )
}

export default Main