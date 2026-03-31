const { supabase } = require('../lib/supabase')

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ message: 'Unauthorized' })

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup failed for user', user.id, profileError?.message)
      return res.status(503).json({ message: 'Account profile not found. Please sign out and sign back in.' })
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
      .single()

    req.user = profile
    req.couple = couple || null
    req.token = token
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = { requireAuth }
