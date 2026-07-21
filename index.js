import { getContext } from '../../../extensions.js';

async function initDeepSearch() {
    const extensionFolderPath = 'scripts/extensions/third-party/st-deep-search';
    
    // 加载 HTML
    const htmlResponse = await fetch(`${extensionFolderPath}/search.html`);
    const htmlText = await htmlResponse.text();
    $('body').append(htmlText);

    // 在顶栏注入按钮
    const searchBtnHtml = `
        <div id="deep-search-btn" class="item" title="深度检索卡片设定">
            <i class="fa-solid fa-magnifying-glass-plus"></i> 
            <span class="m-I">搜卡</span>
        </div>
    `;
    $('#top-bar').append(searchBtnHtml);

    // 打开搜索面板
    $('#deep-search-btn').on('click', () => {
        $('#deep-search-modal').fadeIn(200); 
        $('#deep-search-input').focus();
    });

    // 点击顶栏粉白粉按钮关闭面板
    $('#close-deep-search').on('click', () => {
        $('#deep-search-modal').fadeOut(200);
        $('#deep-search-input').val('');
        $('#deep-search-results').empty();
    });

    // 核心匹配与高亮逻辑
    $('#deep-search-input').on('input', function() {
        const keyword = $(this).val().trim().toLowerCase();
        
        if (!keyword) {
            $('#deep-search-results').empty();
            return;
        }

        const context = getContext();
        const allCharacters = context.characters;
        const matchedCards = [];

        allCharacters.forEach(char => {
            // 需要穿透搜索的字段列表
            const fields = {
                "设定 (Description)": char.description || '',
                "开场白 (First Mes)": char.first_mes || '',
                "备用问候 (Alt Greetings)": (char.alternate_greetings || []).join(' | '),
                "场景剧情 (Scenario)": char.scenario || '',
                "对话示例 (Mes Example)": char.mes_example || ''
            };

            let matchFound = false;
            let previewText = "";

            for (const [fieldName, text] of Object.entries(fields)) {
                if (text.toLowerCase().includes(keyword)) {
                    matchFound = true;
                    
                    // 截取关键词前后的上下文（前后各取约 20 个字符）
                    const index = text.toLowerCase().indexOf(keyword);
                    const start = Math.max(0, index - 20);
                    const end = Math.min(text.length, index + keyword.length + 20);
                    
                    // 构建高亮 HTML
                    const snippet = text.substring(start, end).replace(
                        new RegExp(keyword, 'gi'), 
                        match => `<span class="keyword-highlight">${match}</span>`
                    );
                    
                    previewText = `[${fieldName}] ...${snippet}...`;
                    break; // 只要在一个字段找到匹配，提取展示即可，跳出循环
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
        resultsContainer.append('<div style="padding:16px; font-weight:bold;">未找到包含该关键词的卡片</div>');
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

    // 绑定开卡跳转事件
    $('.deep-search-item').on('click', function() {
        const avatarFileName = $(this).data('avatar');
        $('#deep-search-modal').fadeOut(200);
        // 触发酒馆原生的左侧列表点击事件
        $('.character_select[avatar="' + avatarFileName + '"]').trigger('click');
    });
}

jQuery(async () => {
    await initDeepSearch();
});
