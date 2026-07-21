import { getContext } from '../../../extensions.js';

async function initDeepSearch() {
    const extensionFolderPath = 'scripts/extensions/third-party/st-deep-search';
    
    // 1. 加载 HTML 弹窗模板
    const htmlResponse = await fetch(`${extensionFolderPath}/search.html`);
    const htmlText = await htmlResponse.text();
    $('body').append(htmlText);

    // 2. 构造符合酒馆扩展菜单（魔法棒菜单）样式的按钮，命名为“深度搜卡”
    const searchBtnHtml = `
        <div id="deep-search-btn" class="extension_menu_entry interaction_link">
            <i class="fa-solid fa-magnifying-glass-plus" style="width: 20px; text-align: center; margin-right: 8px;"></i>
            <span>深度搜卡</span>
        </div>
    `;
    
    // 注入到你截图里的那个“扩展菜单”容器中
    $('#extensions_menu').append(searchBtnHtml);

    // 3. 绑定点击事件：点击菜单项打开搜索弹窗
    $(document).on('click', '#deep-search-btn', () => {
        $('#deep-search-modal').css('display', 'flex').hide().fadeIn(200); 
        $('#deep-search-input').focus();
    });

    // 4. 点击顶栏粉白粉按钮关闭弹窗
    $('#close-deep-search').on('click', () => {
        $('#deep-search-modal').fadeOut(200);
        $('#deep-search-input').val('');
        $('#deep-search-results').empty();
    });

    // 5. 核心搜索匹配逻辑
    $('#deep-search-input').on('input', function() {
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
                    
                    // 转义正则特殊字符，防止搜索符号时报错
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

    // 点击搜索结果选中并跳转该角色
    $('.deep-search-item').on('click', function() {
        const avatarFileName = $(this).data('avatar');
        $('#deep-search-modal').fadeOut(200);
        $('.character_select[avatar="' + avatarFileName + '"]').trigger('click');
    });
}

jQuery(async () => {
    await initDeepSearch();
});
