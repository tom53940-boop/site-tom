const contactForm = document.querySelector('[data-contact-form]');

if (contactForm) {
  const statusNode = document.querySelector('[data-form-status]');
  const submitButton = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const honeypot = contactForm.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim() !== '') {
      return;
    }

    const formData = new FormData(contactForm);
    const email = String(formData.get('email') || '').trim();
    const name = String(formData.get('nom') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const consent = contactForm.querySelector('input[name="consentement"]').checked;

    if (!name || !message || !consent || !/^\S+@\S+\.\S+$/.test(email)) {
      renderStatus('Merci de verifier les champs obligatoires.', false);
      return;
    }

    submitButton.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      contactForm.reset();
      renderStatus('Votre message a bien ete envoye. Nous revenons vers vous rapidement.', true);
    } catch (_) {
      renderStatus('Une erreur est survenue. Vous pouvez nous contacter par email.', false);
    } finally {
      submitButton.disabled = false;
    }
  });

  function renderStatus(message, isSuccess) {
    statusNode.textContent = message;
    statusNode.className = `status-msg ${isSuccess ? 'status-success' : 'status-error'}`;
  }
}
