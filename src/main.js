import './styles.css'

// This is the default Vite main.js for vanilla projects

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button">Count: 0</button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

let count = 0;
document.getElementById('counter').addEventListener('click', () => {
  count++;
  document.getElementById('counter').textContent = `Count: ${count}`;
});
