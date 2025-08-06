class PokemonCardSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.orderBtn = document.getElementById('orderBtn');
        this.orderBadge = document.getElementById('orderBadge');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.results = document.getElementById('results');
        
        // 納品書ページ要素
        this.orderPage = document.getElementById('orderPage');
        this.backToSearchBtn = document.getElementById('backToSearchBtn');
        this.manualAddBtn = document.getElementById('manualAddBtn');
        this.manualAddForm = document.getElementById('manualAddForm');
        this.addManualItemBtn = document.getElementById('addManualItemBtn');
        this.cancelManualAddBtn = document.getElementById('cancelManualAddBtn');
        this.orderTable = document.getElementById('orderTable');
        this.orderTableBody = document.getElementById('orderTableBody');
        this.orderEmpty = document.getElementById('orderEmpty');
        this.priceEditNotice = document.getElementById('priceEditNotice');
        this.totalQuantity = document.getElementById('totalQuantity');
        this.totalAmount = document.getElementById('totalAmount');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.clearOrderBtn = document.getElementById('clearOrderBtn');
        
        // 印刷ページ要素
        this.printPage = document.getElementById('printPage');
        this.printDate = document.getElementById('printDate');
        this.printTableBody = document.getElementById('printTableBody');
        this.printTotalQuantity = document.getElementById('printTotalQuantity');
        this.printTotalAmount = document.getElementById('printTotalAmount');
        this.backFromPrintBtn = document.getElementById('backFromPrintBtn');
        
        this.orderData = [];
        this.cardQuantities = new Map();
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        this.orderBtn.addEventListener('click', () => this.showOrderPage());
        
        // 納品書ページ
        this.backToSearchBtn.addEventListener('click', () => this.showSearchPage());
        this.manualAddBtn.addEventListener('click', () => this.showManualAddForm());
        this.addManualItemBtn.addEventListener('click', () => this.addManualItem());
        this.cancelManualAddBtn.addEventListener('click', () => this.hideManualAddForm());
        this.exportPdfBtn.addEventListener('click', () => this.showPrintPage());
        this.clearOrderBtn.addEventListener('click', () => this.clearOrder());
        
        // 印刷ページ
        this.backFromPrintBtn.addEventListener('click', () => this.backFromPrint());
    }
    
    async handleSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.showError('検索番号を入力してください');
            return;
        }
        
        this.showLoading();
        
        try {
            const cards = await this.searchCards(query);
            if (cards.length > 0) {
                this.displayResults(cards);
            } else {
                this.showError('該当するカードが見つかりませんでした');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('検索中にエラーが発生しました');
        }
    }
    
    async searchCards(query) {
        const url = `/api/search?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    
    displayResults(cards) {
        this.hideAll();
        
        this.results.innerHTML = cards.map((card, index) => {
            const cardId = `${card.number}-${index}`;
            const quantity = this.cardQuantities.get(cardId) || 0;
            
            return `
                <div class="card-item">
                    <div class="card-image">
                        ${card.image ? 
                            `<img src="${card.image}" alt="${card.name}" onerror="this.parentElement.innerHTML='画像なし'">` : 
                            '画像なし'
                        }
                    </div>
                    <div class="card-content">
                        <div class="card-number">${card.number}</div>
                        <h3 class="card-name">${card.name}</h3>
                        <div class="card-info">
                            ${card.rarity ? `<span class="card-rarity">レアリティ: ${card.rarity}</span>` : ''}
                            ${card.type ? `<span class="card-type">タイプ: ${card.type}</span>` : ''}
                        </div>
                        ${card.description ? `<p class="card-description">${card.description}</p>` : ''}
                        ${card.price ? `<div class="card-price">価格: ￥${this.formatPrice(card.price)}</div>` : ''}
                        
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" data-card-id="${cardId}" ${quantity === 0 ? 'disabled' : ''}>−</button>
                            <div class="quantity-display">${quantity}</div>
                            <button class="quantity-btn" data-action="increase" data-card-id="${cardId}">＋</button>
                        </div>
                        
                        <button class="add-to-order-btn" data-card-id="${cardId}" ${quantity === 0 ? 'disabled' : ''}>
                            納品書へ追加
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.attachCardEventListeners(cards);
        this.results.classList.remove('hidden');
    }
    
    formatPrice(price) {
        const numericPrice = price.toString().replace(/[^\d]/g, '');
        return parseInt(numericPrice).toLocaleString('ja-JP');
    }
    
    showLoading() {
        this.hideAll();
        this.loading.classList.remove('hidden');
    }
    
    showError(message) {
        this.hideAll();
        this.error.textContent = message;
        this.error.classList.remove('hidden');
    }
    
    hideAll() {
        this.loading.classList.add('hidden');
        this.error.classList.add('hidden');
        this.results.classList.add('hidden');
    }
    
    attachCardEventListeners(cards) {
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuantityChange(e, cards));
        });
        
        document.querySelectorAll('.add-to-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddToOrder(e, cards));
        });
    }
    
    handleQuantityChange(e, cards) {
        const cardId = e.target.dataset.cardId;
        const action = e.target.dataset.action;
        const currentQuantity = this.cardQuantities.get(cardId) || 0;
        
        let newQuantity = currentQuantity;
        if (action === 'increase') {
            newQuantity = currentQuantity + 1;
        } else if (action === 'decrease' && currentQuantity > 0) {
            newQuantity = currentQuantity - 1;
        }
        
        this.cardQuantities.set(cardId, newQuantity);
        this.updateCardDisplay(cardId, newQuantity);
    }
    
    updateCardDisplay(cardId, quantity) {
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`).closest('.card-item');
        const quantityDisplay = cardElement.querySelector('.quantity-display');
        const decreaseBtn = cardElement.querySelector('[data-action="decrease"]');
        const addToOrderBtn = cardElement.querySelector('.add-to-order-btn');
        
        quantityDisplay.textContent = quantity;
        decreaseBtn.disabled = quantity === 0;
        addToOrderBtn.disabled = quantity === 0;
    }
    
    handleAddToOrder(e, cards) {
        const cardId = e.target.dataset.cardId;
        const quantity = this.cardQuantities.get(cardId) || 0;
        
        if (quantity === 0) return;
        
        const [cardNumber, index] = cardId.split('-');
        const card = cards[parseInt(index)];
        
        this.orderData.push({
            ...card,
            quantity: quantity,
            addedAt: new Date().toISOString()
        });
        
        this.cardQuantities.set(cardId, 0);
        this.updateCardDisplay(cardId, 0);
        this.updateOrderBadge();
    }
    
    updateOrderBadge() {
        const totalItems = this.orderData.length;
        this.orderBadge.textContent = totalItems;
        
        if (totalItems > 0) {
            this.orderBadge.classList.remove('hidden');
        } else {
            this.orderBadge.classList.add('hidden');
        }
    }
    
    handleRefresh() {
        const query = this.searchInput.value.trim();
        if (query) {
            this.handleSearch();
        } else {
            this.showError('検索クエリを入力してからデータ更新してください');
        }
    }
    
    showOrderPage() {
        document.querySelector('.container').classList.add('hidden');
        this.orderPage.classList.remove('hidden');
        this.renderOrderTable();
    }
    
    showSearchPage() {
        this.orderPage.classList.add('hidden');
        document.querySelector('.container').classList.remove('hidden');
    }
    
    showManualAddForm() {
        this.manualAddForm.classList.remove('hidden');
    }
    
    hideManualAddForm() {
        this.manualAddForm.classList.add('hidden');
        this.clearManualAddForm();
    }
    
    clearManualAddForm() {
        document.getElementById('manualTitle').value = '';
        document.getElementById('manualNumber').value = '';
        document.getElementById('manualRarity').value = '';
        document.getElementById('manualPrice').value = '';
        document.getElementById('manualQuantity').value = '1';
    }
    
    addManualItem() {
        const title = document.getElementById('manualTitle').value.trim();
        const number = document.getElementById('manualNumber').value.trim();
        const rarity = document.getElementById('manualRarity').value.trim();
        const price = parseInt(document.getElementById('manualPrice').value) || 0;
        const quantity = parseInt(document.getElementById('manualQuantity').value) || 1;
        
        if (!title || price <= 0 || quantity <= 0) {
            alert('商品タイトルと価格、数量を正しく入力してください');
            return;
        }
        
        const manualItem = {
            name: title,
            number: number || '手動追加',
            rarity: rarity,
            type: '',
            price: price.toString(),
            quantity: quantity,
            addedAt: new Date().toISOString(),
            isManual: true
        };
        
        this.orderData.push(manualItem);
        this.updateOrderBadge();
        this.hideManualAddForm();
        this.renderOrderTable();
    }
    
    renderOrderTable() {
        if (this.orderData.length === 0) {
            this.orderTable.classList.add('hidden');
            this.orderEmpty.classList.remove('hidden');
            this.priceEditNotice.classList.add('hidden');
            this.updateOrderSummary();
            return;
        }
        
        this.orderTable.classList.remove('hidden');
        this.orderEmpty.classList.add('hidden');
        this.priceEditNotice.classList.remove('hidden');
        
        this.orderTableBody.innerHTML = this.orderData.map((item, index) => {
            const price = parseInt(item.price.toString().replace(/[^\d]/g, '')) || 0;
            const subtotal = price * item.quantity;
            
            return `
                <tr data-index="${index}">
                    <td>
                        <div style="font-weight: 600;">${item.name}</div>
                        <div style="font-size: 0.9rem; color: #7f8c8d;">
                            ${item.number} ${item.rarity ? `| ${item.rarity}` : ''} ${item.type ? `| ${item.type}` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="price-editable" data-index="${index}" data-price="${price}">
                            ￥${price.toLocaleString('ja-JP')}
                        </span>
                    </td>
                    <td>${item.quantity}</td>
                    <td class="subtotal">￥${subtotal.toLocaleString('ja-JP')}</td>
                    <td>
                        <button class="delete-btn" data-index="${index}">削除</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.attachOrderTableEventListeners();
        this.updateOrderSummary();
    }
    
    attachOrderTableEventListeners() {
        // 価格編集
        document.querySelectorAll('.price-editable').forEach(span => {
            span.addEventListener('click', (e) => this.editPrice(e));
        });
        
        // 削除ボタン
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteOrderItem(e));
        });
    }
    
    editPrice(e) {
        const span = e.target;
        const index = parseInt(span.dataset.index);
        const currentPrice = parseInt(span.dataset.price);
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentPrice;
        input.min = '0';
        input.className = 'price-editing';
        
        const savePrice = () => {
            const newPrice = parseInt(input.value) || 0;
            if (newPrice >= 0) {
                this.orderData[index].price = newPrice.toString();
                this.renderOrderTable();
            }
        };
        
        input.addEventListener('blur', savePrice);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                savePrice();
            }
        });
        
        span.parentNode.replaceChild(input, span);
        input.focus();
        input.select();
    }
    
    deleteOrderItem(e) {
        const index = parseInt(e.target.dataset.index);
        
        if (confirm('この商品を削除しますか？')) {
            this.orderData.splice(index, 1);
            this.updateOrderBadge();
            this.renderOrderTable();
        }
    }
    
    updateOrderSummary() {
        let totalQty = 0;
        let totalAmt = 0;
        
        this.orderData.forEach(item => {
            const price = parseInt(item.price.toString().replace(/[^\d]/g, '')) || 0;
            totalQty += item.quantity;
            totalAmt += price * item.quantity;
        });
        
        this.totalQuantity.textContent = totalQty.toLocaleString('ja-JP');
        this.totalAmount.textContent = `￥${totalAmt.toLocaleString('ja-JP')}`;
        
        this.exportPdfBtn.disabled = this.orderData.length === 0;
        this.clearOrderBtn.disabled = this.orderData.length === 0;
    }
    
    clearOrder() {
        if (this.orderData.length === 0) return;
        
        if (confirm('納品書の内容をすべてクリアしますか？')) {
            this.orderData = [];
            this.updateOrderBadge();
            this.renderOrderTable();
        }
    }
    
    showPrintPage() {
        if (this.orderData.length === 0) {
            alert('納品書にアイテムがありません');
            return;
        }
        
        // 印刷ページのデータを準備
        this.preparePrintData();
        
        // ページを切り替え
        this.orderPage.classList.add('hidden');
        this.printPage.classList.remove('hidden');
        
        // 印刷ダイアログを自動表示
        setTimeout(() => {
            window.print();
        }, 500);
    }
    
    preparePrintData() {
        // 日付設定
        const today = new Date().toLocaleDateString('ja-JP');
        this.printDate.textContent = today;
        
        // テーブルデータ作成
        let totalQty = 0;
        let totalAmt = 0;
        
        this.printTableBody.innerHTML = this.orderData.map(item => {
            const price = parseInt(item.price.toString().replace(/[^\d]/g, '')) || 0;
            const subtotal = price * item.quantity;
            totalQty += item.quantity;
            totalAmt += subtotal;
            
            return `
                <tr>
                    <td>${item.name}</td>
                    <td>￥${price.toLocaleString('ja-JP')}</td>
                    <td>${item.quantity}</td>
                    <td>￥${subtotal.toLocaleString('ja-JP')}</td>
                </tr>
            `;
        }).join('');
        
        // 合計金額設定
        this.printTotalQuantity.textContent = totalQty.toLocaleString('ja-JP');
        this.printTotalAmount.textContent = `￥${totalAmt.toLocaleString('ja-JP')}`;
    }
    
    backFromPrint() {
        this.printPage.classList.add('hidden');
        this.orderPage.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PokemonCardSearch();
});