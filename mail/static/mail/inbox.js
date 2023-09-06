document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#display-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#display-email').style.display = 'none';
  // Show the mailbox name(and also resets the previous display)
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email ' + (email.read? 'read':'unread');

        emailDiv.innerHTML =`
        <span>From:</strong> ${email.sender}</span><br>
        <span>Subject:</strong> ${email.subject}</span><br>
        <span>Date:</strong> ${email.timestamp}</span>
      `;
        document.querySelector('#emails-view').append(emailDiv)

        //open mail upon clicking
        emailDiv.addEventListener('click', ()=> viewEmail(email.id,mailbox))
      });
  });
}


function send_email() {

  // Get composition fields
  recipients = document.querySelector('#compose-recipients').value;
  subject = document.querySelector('#compose-subject').value;
  body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  }).then( ()=> load_mailbox('sent'));
 
  //stops from submitting(by default 'submit' in 'form' submits..)
  return false

}


function viewEmail(email_id,mailbox){
  document.querySelector('#emails-view').style.display = 'none';
  archiveButton = document.querySelector('#archive-button');
  replyButton = document.querySelector('#reply-button');

  //mark mail as read
  fetch(`emails/${email_id}`,{
    method:'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  //load email info
  fetch(`emails/${email_id}`)
  .then(response =>response.json())
  .then(email => {
    emailDiv = document.querySelector('#display-email');
    emailContent = document.querySelector('#email-content');
    //change the content of the text in that block
    emailContent.innerHTML =` 
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>Recipients:</strong> ${email.recipients}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr>
        <p id="bodyContent"><strong></strong> ${email.body}</p>
      `;  
    if (email.archived) {
      archiveButton.textContent = 'Unarchive';
    } else {
      archiveButton.textContent = 'Archive';
    }

    //add functionality to the Archive button and reply
    archiveButton.onclick = ()=> toggleArchive(archiveButton,email_id);
    replyButton.onclick = ()=> reply(email_id);

  }) 
  .then(()=> {//after everything is loaded and functionality added - show the whole email block
    emailDiv.style.display = 'block'  
    mailbox=='sent'? archiveButton.style.display = 'none': archiveButton.style.display = 'inline' //sent email won't be archivable
  })   
}


function toggleArchive(archiveButton,email_id){
    fetch(`emails/${email_id}`)
    .then(response =>response.json())
    .then(email => {
      const newArchiveStatus = !email.archived;
      fetch(`emails/${email_id}`,{
        method:'PUT',
        body: JSON.stringify({
          archived: newArchiveStatus
        })
      })
      .then(()=>{
        if (newArchiveStatus) {
          archiveButton.textContent = 'Unarchive';
        } else {
          archiveButton.textContent = 'Archive';
        }
      })    
    })  
}


function reply(email_id){
    //hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#display-email').style.display = 'none';

    //get some reply information
    fetch(`emails/${email_id}`)
    .then(respond=>respond.json())
    .then(email=>{
      document.querySelector('#compose-recipients').value = email.sender;
      //prefix subject with 'Re:' (unless already contains)
      document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ')? email.subject : `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;

    })
    .then(()=>document.querySelector('#compose-view').style.display = 'block')

}