const GSI_SRC = 'https://accounts.google.com/gsi/client'

let loadPromise = null

export function loadGoogleSdk() {
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)
    const script = document.createElement('script')
    script.src   = GSI_SRC
    script.async = true
    script.defer = true
    script.onload  = () => resolve(window.google)
    script.onerror = () => reject(new Error('gsi_script_failed'))
    document.head.appendChild(script)
  })
  return loadPromise
}
