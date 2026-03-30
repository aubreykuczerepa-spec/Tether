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

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
      .single()

    req.user = profile || { id: user.id, email: user.email }
    req.couple = couple || null
    req.token = token
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = { requireAuth }
