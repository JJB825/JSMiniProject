//selectors for cart functionality
const cartBtn = document.getElementById('your-cart-btn');
const closeCartBtn = document.querySelector('.fa-remove');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartContent = document.querySelector('.cart-content');
const noOfcartItems = document.querySelector('.cart-item-no');
const cartTotal = document.querySelector('.cart-total');
const clearCartBtn = document.querySelector('.clear-cart');

// selectors for menu functionality
const menuContainer = document.querySelector('.menu-container');
const btnContainer = document.querySelector('.btns');

// selectors for accordion functionality
const plusButtons = document.querySelectorAll('.fa-plus');
const answers = document.querySelectorAll('.answer');

// cart
let cart = [];
// cartButtons
let buttonsDOM = [];

// classes for grouping methods and functions

// for getting products from JSON or external resource (here from menuItems array)
class Products {
  async getProducts() {
    try {
      let result = await fetch('products.json');
      let data = await result.json();
      const products = data.items.map(function (item) {
        const { name, desc, price, category } = item.fields;
        const { id } = item.sys;
        const img = item.fields.img.fields.file.url;
        return { id, name, desc, price, category, img };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// for displaying products on webpage
class UI {
  // function to dynamically display menu items
  displayMenuItems(menu) {
    let displayMenu = menu.map((item) => {
      return `<div class="container">
          <img src="${item.img}" alt="${item.name}" />
          <div class="content">
            <h4>${item.name}</h4>
            <p>
              ${item.desc}
            </p>
            <div class="row">
              <span>$${item.price}</span>
              <button class="btn cart-btn" data-id=${item.id}>Add to Cart</button>
            </div>
          </div>
        </div>`;
    });
    displayMenu = displayMenu.join('');
    menuContainer.innerHTML = displayMenu;

    // Update button states based on the cart content
    this.updateCartButtons();
  }

  // function to dynamically generate buttons based on categories in menuItems array and filtering based on button click
  displayMenuButtons(menuItems) {
    // dynamically create a unique set of categories from the menuItems array
    const categories = menuItems.reduce(
      (acc, item) => {
        if (!acc.includes(item.category)) {
          acc.push(item.category);
        }
        return acc;
      },
      ['all']
    );

    // dynamically generate buttons based on categories array
    const categoryBtns = categories
      .map((category) => {
        return `<button class="btn menu-btn" data-id="${category}">${category}</button>`;
      })
      .join('');
    btnContainer.innerHTML = categoryBtns;

    // selecting the buttons only after the buttons are loaded on to DOM
    const menuBtns = btnContainer.querySelectorAll('.menu-btn');

    // filtering the display items based on which button is clicked
    menuBtns.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const filter = event.target.dataset.id;
        if (filter === 'all') {
          this.displayMenuItems(menuItems);
        } else {
          const filteredItems = menuItems.filter(
            (item) => item.category === filter
          );
          this.displayMenuItems(filteredItems);
        }
        // Reattach event listeners to newly rendered buttons
        this.addToCart();
      });
    });
  }

  addToCart() {
    buttonsDOM = [...document.querySelectorAll('.cart-btn')];
    buttonsDOM.forEach((cartBtn) => {
      // check if the item is already added to cart or not, if yes, then disable that button
      let id = cartBtn.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        cartBtn.innerText = 'In Cart';
        cartBtn.disabled = true;
      }

      // add event listener to button to perform following events
      cartBtn.addEventListener('click', (event) => {
        // disable the button for further clicking
        event.target.innerText = 'In Cart';
        event.target.disabled = true;

        // get product from local storage
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        // add product to cart
        cart = [...cart, cartItem];

        // store cart in local storage
        Storage.saveCart(cart);

        // set number of cart items on cart button at top right
        this.setCartValues(cart);

        // add cart item to cart element
        this.addCartItem(cartItem);

        // display cart element
        this.displayCart();
      });
    });
  }

  updateCartButtons() {
    buttonsDOM = [...document.querySelectorAll('.cart-btn')];
    buttonsDOM.forEach((cartBtn) => {
      let id = cartBtn.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        cartBtn.innerText = 'In Cart';
        cartBtn.disabled = true;
      }
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.forEach((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    noOfcartItems.innerText = itemsTotal;
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" />
            <div class="desc">
              <h4>${item.name}</h4>
              <div class="row">
                <span>$${item.price}</span>
                <button class="btn rem-btn" data-id=${item.id}>Remove</button>
              </div>
            </div>
            <div class="quantity">
              <i class="fa-solid fa-chevron-up" data-id=${item.id}></i>
              <span>${item.amount}</span>
              <i class="fa-solid fa-chevron-down" data-id=${item.id}></i>
            </div>`;
    cartContent.appendChild(div);
  }

  displayCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }

  setUpApp() {
    // get cart from local storage
    cart = Storage.getProductData();
    // set cart values
    this.setCartValues(cart);
    // populate the cart with obtained values
    this.populateCart(cart);
    // close and open the cart
    cartBtn.addEventListener('click', this.displayCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }

  populateCart(cart) {
    cart.forEach((item) => this.addCartItem(item));
  }

  cartLogic() {
    // handle clearing the cart
    clearCartBtn.addEventListener('click', () => {
      this.clearCart();
    });

    // handling remove one item and update amount of items
    // adding event listeners to cart-content div and using event bubbling (event.target) to detect which element is clicked
    cartContent.addEventListener('click', (event) => {
      let id = event.target.dataset.id;
      if (event.target.classList.contains('rem-btn')) {
        this.removeItem(id);
        cartContent.removeChild(
          event.target.parentElement.parentElement.parentElement
        );
      } else if (event.target.classList.contains('fa-chevron-up')) {
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount += 1;
        event.target.nextElementSibling.innerText = tempItem.amount;
        this.setCartValues(cart);
        Storage.saveCart(cart);
      } else if (event.target.classList.contains('fa-chevron-down')) {
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount -= 1;
        if (tempItem.amount === 0) {
          this.removeItem(id);
          cartContent.removeChild(event.target.parentElement.parentElement);
        } else {
          event.target.previousElementSibling.innerText = tempItem.amount;
          this.setCartValues(cart);
          Storage.saveCart(cart);
        }
      }
    });
  }

  clearCart() {
    // here this will be pointing to the click event and not UI class if we reference this function to the click event
    // so the alternative for this is to use a pointer function and call this function within that function
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));
    console.log(cartContent.children);
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerText = 'Add to Cart';
  }

  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }

  // handle accordion code
  questions() {
    plusButtons.forEach(function (plusbtn) {
      plusbtn.addEventListener('click', function (event) {
        const clickedBtn = event.target;
        if (clickedBtn.classList.contains('fa-plus')) {
          clickedBtn.classList.remove('fa-plus');
          clickedBtn.classList.add('fa-minus');
          answers.forEach(function (answer) {
            if (answer.classList.contains('show-text')) {
              answer.previousElementSibling.children[1].classList.remove(
                'fa-minus'
              );
              answer.previousElementSibling.children[1].classList.add(
                'fa-plus'
              );
              answer.classList.remove('show-text');
            }
          });
          clickedBtn.parentElement.nextElementSibling.classList.add(
            'show-text'
          );
        } else {
          clickedBtn.classList.remove('fa-minus');
          clickedBtn.classList.add('fa-plus');
          clickedBtn.parentElement.nextElementSibling.classList.remove(
            'show-text'
          );
        }
      });
    });
  }
}

// local storage
class Storage {
  // save products to local storage
  static saveProducts(menuItems) {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
  }

  // get specific product from local storage to store it in cart based on id
  static getProduct(id) {
    let menu_items = JSON.parse(localStorage.getItem('menuItems'));
    return menu_items.find(function (menu_item) {
      return menu_item.id === id;
    });
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getProductData() {
    return localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : [];
  }
}

// adding a event listener to window to trigger the above two functions when the DOM loads
window.addEventListener('DOMContentLoaded', function () {
  const ui = new UI();
  const products = new Products();

  products
    .getProducts()
    .then((menuItems) => {
      ui.displayMenuButtons(menuItems);
      ui.displayMenuItems(menuItems);
      Storage.saveProducts(menuItems);
    })
    .then(() => {
      ui.addToCart();
      ui.cartLogic();
    })
    .catch((err) => {
      console.log(err);
    });

  // set up application
  ui.questions();
  // ui.setUpApp();
  ui.setUpApp();
});
