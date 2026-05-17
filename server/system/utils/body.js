export const readJsonBody = async (request) => {
  try {
    return await request.json()
  } catch {
    return null
  }
}
