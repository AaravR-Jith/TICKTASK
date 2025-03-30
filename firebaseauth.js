// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { 
    getFirestore, 
    setDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDRbQKhLrE9bzHGYTewfrP-uG3_DR75Gfo",
    authDomain: "login-form-265f6.firebaseapp.com",
    projectId: "login-form-265f6",
    storageBucket: "login-form-265f6.appspot.com",
    messagingSenderId: "431116535291",
    appId: "1:431116535291:web:47ea2b4cd26dfc38c9775e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function() {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// Form toggle functionality
document.getElementById('signUpButton').addEventListener('click', function() {
    document.getElementById('signIn').style.display = 'none';
    document.getElementById('signup').style.display = 'block';
});

document.getElementById('signInButton').addEventListener('click', function() {
    document.getElementById('signup').style.display = 'none';
    document.getElementById('signIn').style.display = 'block';
});

// Sign Up functionality
document.getElementById('submitSignUp').addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email: email,
                firstName: firstName,
                lastName: lastName
            };
            
            showMessage('Account Created Successfully', 'signUpMessage');
            
            const docRef = doc(db, "users", user.uid);
            setDoc(docRef, userData)
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error writing document", error);
                    showMessage('Error saving user data', 'signUpMessage');
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == 'auth/email-already-in-use') {
                showMessage('Email address already exists!', 'signUpMessage');
            } else if (errorCode == 'auth/weak-password') {
                showMessage('Password should be at least 6 characters', 'signUpMessage');
            } else {
                showMessage('Unable to create user: ' + error.message, 'signUpMessage');
            }
        });
});

// Sign In functionality
document.getElementById('submitSignIn').addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            window.location.href = 'main.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == 'auth/invalid-credential') {
                showMessage('Invalid email or password', 'signInMessage');
            } else {
                showMessage('Error signing in: ' + error.message, 'signInMessage');
            }
        });
});
const signIn=document.getElementById('submitSignIn');
signIn.addEventListener('click',(event)=>{
    event.preventDefault();
    const email=document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const auth=getAuth();

    signInWithEmailAndPassword(auth,email,password)
    .then((userCredential)=>{
        showMessage('login is successfull','signInMessage');
        const user=userCredential.user;
        localStorage.setItem('loggedInUserId',user.id);
        window.location.href='main.html'

    })
    .catch((error)=>{
        const errorCode=error.code;
        if(errorCode=='auth/invalid-credential '){
            showMessage('Incorrect email or password','signInMessage');
        }
        else{
            showMessage('Account does not exist','signInMessage');
        }
    })
})