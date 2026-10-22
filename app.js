// ==========================================================
// 1. IMPORTAÇÕES E CONFIGURAÇÃO DO FIREBASE
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// ADICIONE ESTAS DUAS LINHAS ABAIXO:
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAUeNqpagN-1JmKZ4Y5yOtUovtdVQXrB9c",
    authDomain: "projetotcc-3ace5.firebaseapp.com",
    databaseURL: "https://projetotcc-3ace5-default-rtdb.firebaseio.com",
    projectId: "projetotcc-3ace5",
    storageBucket: "projetotcc-3ace5.firebasestorage.app",
    messagingSenderId: "1022715712496",
    appId: "1:1022715712496:web:6923c5a87a81bddd86c335",
    measurementId: "G-HYCZQT0BS7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // INICIALIZA O BANCO DE DADOS





// ==========================================================
// 2. SISTEMA DE LOGIN
// ==========================================================
const btnLoginAuth = document.getElementById('btn-login-auth');
const userInfo = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const btnLogout = document.getElementById('btn-logout');

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (btnLoginAuth) btnLoginAuth.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userNameSpan) userNameSpan.innerText = `Olá, ${user.displayName || user.email.split('@')[0]}`;

        // 🔥 CARREGA CARRINHO DO FIREBASE
        const carrinhoRef = ref(db, 'carrinhos/' + user.uid);

        onValue(carrinhoRef, (snapshot) => {
            carrinho = snapshot.val() || [];
            atualizarTudo();
        });

    } else {
        if (btnLoginAuth) btnLoginAuth.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            alert("Você saiu da conta.");
            window.location.reload();
        });
    });
}
});

// ==========================================================
// 3. CARROSSEL E FILTROS
// ==========================================================
let slides = document.querySelectorAll('.slide');
let currentSlide = 0;
if (slides.length > 0) {
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

window.filterProducts = function(category) {
    const cards = document.querySelectorAll('.product-card');
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${category}'`)) btn.classList.add('active');
    });
    cards.forEach(card => {
        card.style.opacity = '0';
        setTimeout(() => {
            if (category === 'todos' || card.getAttribute('data-category') === category) {
                card.style.display = 'flex';
                setTimeout(() => card.style.opacity = '1', 50);
            } else {
                card.style.display = 'none';
            }
        }, 300);
    });
};

// ==========================================================
// 4. CONTROLE DO CARRINHO (LÓGICA PRINCIPAL)
// ==========================================================
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

window.toggleCart = function() {
    const cart = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (cart && overlay) {
        cart.classList.toggle('open');
        if (cart.classList.contains('open')) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('open'), 10);
        } else {
            overlay.classList.remove('open');
            setTimeout(() => overlay.style.display = 'none', 400);
        }
    }
};

window.adicionarAoCarrinho = function(nome, preco, imagem) {
    const produto = {
        nome: nome,
        preco: parseFloat(preco.replace('R$', '').replace('.', '').replace(',', '.')),
        imagem: imagem,
        id: Date.now()
    };
    carrinho.push(produto);
    atualizarTudo();
    if (!document.getElementById('cart-sidebar').classList.contains('open')) window.toggleCart();
};

window.removerDoCarrinho = function(index) {
    carrinho.splice(index, 1);
    atualizarTudo();
};

window.limparCarrinho = function() {
    if (carrinho.length === 0) return;

    if (confirm("Deseja limpar todo o carrinho?")) {
        carrinho = [];

        const user = auth.currentUser;
        if (user) {
            remove(ref(db, 'carrinhos/' + user.uid)); // 🔥 limpa no Firebase
        }

        atualizarTudo();
    }
};

function atualizarTudo() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    renderizarCarrinho();

    const user = auth.currentUser;
    if (user) {
        salvarCarrinhoFirebase(user.uid); // 🔥 salva no Firebase
    }
}
function renderizarCarrinho() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('total-price');
    if (!container || !totalEl) return;

    container.innerHTML = carrinho.length === 0 ? '<p class="empty-msg">Seu carrinho está vazio.</p>' : '';
    let total = 0;

    carrinho.forEach((item, index) => {
        total += item.preco;
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.imagem}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div class="cart-item-info">
                    <h4>${item.nome}</h4>
                    <span>R$ ${item.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <button onclick="removerDoCarrinho(${index})" class="btn-remove">✕</button>
            </div>`;
    });
    totalEl.innerText = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

// CARRINHO FIREBASE
function salvarCarrinhoFirebase(userId) {
    set(ref(db, 'carrinhos/' + userId), carrinho);
}

// ==========================================================
// 5. INICIALIZAÇÃO DE EVENTOS
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrinho(); // Carrega o que já estava no localStorage

    // Botão Fechar X
    const btnClose = document.querySelector('.close-cart');
    if (btnClose) btnClose.onclick = () => window.toggleCart();

    // Botão Limpar
    const btnClear = document.getElementById('btn-clear-cart');
    if (btnClear) btnClear.onclick = () => window.limparCarrinho();

    // Botões de Adicionar nos Cards
    document.querySelectorAll('.product-card').forEach(card => {
        const btn = card.querySelector('.btn-buy-icon');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                const nome = card.querySelector('h3').innerText;
                const preco = card.querySelector('.price').innerText;
                const img = card.querySelector('img').src;
                window.adicionarAoCarrinho(nome, preco, img);
            };
        }
    });

    // BOTÃO FINALIZAR COMPRA (REDIRECIONAMENTO)
    const btnFinalizar = document.querySelector('.btn-checkout');
    if (btnFinalizar) {
        btnFinalizar.onclick = () => {
            if (carrinho.length === 0) return alert("Carrinho vazio!");
            window.location.href = 'checkout.html';
        };
    }
});



// ==========================================================
// 6. UTILITÁRIOS (SCROLL SPY)
// ==========================================================
window.addEventListener('scroll', () => {
    let current = "";
    document.querySelectorAll('section').forEach(s => {
        if (window.pageYOffset >= s.offsetTop - 200) current = s.id;
    });
    document.querySelectorAll('nav ul li a').forEach(l => {
        l.classList.remove("active");
        if (l.getAttribute("href") === `#${current}`) l.classList.add("active");
    });
});