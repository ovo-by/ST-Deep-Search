import { getContext } from '../../../extensions.js';

async function initDeepSearch() {
    const extensionFolderPath = 'scripts/extensions/third-party/st-deep-search';
    
    // 1. 加载 HTML 弹窗模板
    const htmlResponse = await fetch(`${extensionFolderPath}/search.html`);
    const htmlText = await htmlResponse.text();
    $('body').append(htmlText);

    // 2. 构造菜单按钮 HTML
    const searchBtnHtml = `
        <div id="deep-search-btn" class="extension_menu_entry interaction_link">
            <i class="fa-solid fa-magnifying-glass-plus" style="width: 20px; text-align: center; margin-right: 8px;"></i>
            <span>深度搜卡</span>
        </div>
    `;

    // 3. 循环等待酒馆侧边栏菜单（#extensions_menu）渲染完成，防止找不到节点
    const checkMenuExist = setInterval(() => {
        const menuContainer = $('#extensions_menu');
        if (menuContainer.length > 0) {
            if ($('#deep-search-btn').length === 0) {
                menuContainer.append(searchBtnHtml);
            }
            clearInterval(checkMenuExist); // 成功挂载后停止循环
        }
    }, 500);

    // 4. 绑定点击事件：打开搜索弹窗
    $(document).on('click', '#deep-search-btn', () => {
        $('#deep-search-modal').css('display', 'flex').hide().fadeIn(200); 
        $('#deep-search-input').focus();
    });

    // 5. 点击顶栏粉白粉按钮关闭弹窗
    $(document).on('click', '#close-deep-search', () => {
        $('#deep-search-modal').fadeOut(200);
        $('#deep-search-input').val('');
        $('#deep-search-results').empty();
    });

    // 6. 核心搜索逻辑
    $(document).on('input', '#deep-search-input', function() {
        const keyword = $(this).val().trim().toLowerCase();
        
        if (!keyword) {
            $('#deep-search-results').empty();
            return;
        }

        const context = getContext();
        const allCharacters = context.characters || [];
        const matchedCards = [];

        allCharacters.forEach(char => {
            const fields = {
                "设定": char.description || '',
                "开场白": char.first_mes || '',
                "备用问候": (char.alternate_greetings || []).join(' | '),
                "场景剧情": char.scenario || '',
                "对话示例": char.mes_example || ''
            };

            let matchFound = false;
            let previewText = "";

            for (const [fieldName, text] of Object.entries(fields)) {
                if (text.toLowerCase().includes(keyword)) {
                    matchFound = true;
                    
                    const index = text.toLowerCase().indexOf(keyword);
                    const start = Math.max(0, index - 20);
                    const end = Math.min(text.length, index + keyword.length + 20);
                    
                    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const snippet = text.substring(start, end).replace(
                        new RegExp(safeKeyword, 'gi'), 
                        match => `<span class="keyword-highlight">${match}</span>`
                    );
                    
                    previewText = `[${fieldName}] ...${snippet}...`;
                    break;
                }
            }

            if (matchFound) {
                matchedCards.push({ char, previewText });
            }
        });

        renderSearchResults(matchedCards);
    });
}

function renderSearchResults(cardsData) {
    const resultsContainer = $('#deep-search-results');
    resultsContainer.empty();

    if (cardsData.length === 0) {
        resultsContainer.append('<div style="padding:16px; font-weight:bold; color:#000;">未找到包含该关键词的卡片</div>');
        return;
    }

    cardsData.forEach(data => {
        const char = data.char;
        const avatarUrl = `/characters/${char.avatar}`;
        
        const cardHtml = `
            <div class="deep-search-item" data-avatar="${char.avatar}">
                <img src="${avatarUrl}" alt="${char.name}" class="deep-search-avatar">
                <div style="flex: 1; overflow: hidden;">
                    <div class="deep-search-name">${char.name}</div>
                    <div class="matched-text">${data.previewText}</div>
                </div>
            </div>
        `;
        resultsContainer.append(cardHtml);
    });

    // 点击搜索结果切换角色
    $(document).off('click', '.deep-search-item').on('click', '.deep-search-item', function() {
        const avatarFileName = $(this).data('avatar');
        $('#deep-search-modal').fadeOut(200);
        $('.character_select[avatar="' + avatarFileName + '"]').trigger('click');
    });
}

jQuery(async () => {
    await initDeepSearch();
});
