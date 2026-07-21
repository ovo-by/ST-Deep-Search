import { getContext } from '../../../extensions.js';

async function initDeepSearch() {
    const extensionFolderPath = 'scripts/extensions/third-party/st-deep-search';
    
    // 1. 加载 HTML 弹窗模板
    const htmlResponse = await fetch(`${extensionFolderPath}/search.html`);
    const htmlText = await htmlResponse.text();
    $('body').append(htmlText);

    // 2. 构造菜单按钮 HTML
    const searchBtnHtml = `
        <div id="deep-search-btn" class="extension_menu_entry interaction_link" style="cursor: pointer;">
            <i class="fa-solid fa-magnifying-glass-plus" style="width: 20px; text-align: center; margin-right: 8px;"></i>
            <span>深度搜卡</span>
        </div>
    `;

    // 3. 终极挂载策略：寄生找邻居法 (完美避开由于酒馆更新导致的 ID 变动)
    const injectInterval = setInterval(() => {
        // 如果已经挂载成功，停止循环
        if ($('#deep-search-btn').length > 0) {
            clearInterval(injectInterval);
            return;
        }

        // 寻找魔法棒菜单里现有的其他选项（比如 Token计数器、生成图片 等）
        const existingEntries = $('.extension_menu_entry');
        if (existingEntries.length > 0) {
            // 找到它们所在的父容器，把“深度搜卡”直接追加到末尾
            existingEntries.last().parent().append(searchBtnHtml);
            console.log('[深度搜卡] 成功挂载到魔法棒菜单！');
            clearInterval(injectInterval);
            return;
        }

        // 兜底方案：如果没找到其他类名，尝试酒馆原生的单数菜单 ID
        const fallbackContainer = $('#extension_menu, #chat_actions_menu');
        if (fallbackContainer.length > 0) {
            fallbackContainer.first().append(searchBtnHtml);
            console.log('[深度搜卡] 成功挂载到兜底容器！');
            clearInterval(injectInterval);
        }
    }, 1000); // 每 1 秒尝试一次，直到页面完全加载完毕挂载成功为止

    // 4. 绑定点击事件：打开搜索弹窗
    $(document).on('click', '#deep-search-btn', () => {
        $('#deep-search-modal').css('display', 'flex').hide().fadeIn(200); 
        $('#deep-search-input').focus();
        
        // 可选：点击后自动收起酒馆的魔法棒菜单
        const closeMenuBtn = $('#extension_wand');
        if (closeMenuBtn.length) closeMenuBtn.trigger('click');
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
        // 维持高对比度风格
        resultsContainer.append('<div style="padding:16px; font-weight:bold; color:#000;">未找到包含该关键词的卡片</div>');
        return;
    }

    cardsData.forEach(data => {
        const char = data.char;
        const avatarUrl = `/characters/${char.avatar}`;
        
        // 渲染列表，维持头像始终露出以及像素边框风格
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

    // 点击搜索结果选中并跳转角色
    $(document).off('click', '.deep-search-item').on('click', '.deep-search-item', function() {
        const avatarFileName = $(this).data('avatar');
        $('#deep-search-modal').fadeOut(200);
        $('.character_select[avatar="' + avatarFileName + '"]').trigger('click');
    });
}

jQuery(async () => {
    await initDeepSearch();
});
