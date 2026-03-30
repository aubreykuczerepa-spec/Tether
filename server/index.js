require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }))

// API routes
app.use('/api/auth',       require('./routes/auth'))
app.use('/api/couple',     require('./routes/couple'))
app.use('/api/onboarding', require('./routes/onboarding'))
app.use('/api/entries',    require('./routes/entries'))
app.use('/api/stories',    require('./routes/stories'))

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist')
  app.use(express.static(clientBuild))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'))
  })
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Tether running on port ${PORT}`)
})
