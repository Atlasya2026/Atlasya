
        const COMMUNITY_REACTION_EMOJIS = ['👍','❤️','😂','😮','😢'];

        function renderCommunityMessages(msgs, isAR, groupId) {
            const container = document.getElementById('communityChatMsgs');
            if (!container) return;
            window._communityMsgCache = window._communityMsgCache || {};
            window._communityMsgCache[groupId] = {};
            msgs.forEach(m => { window._communityMsgCache[groupId][m.id] = m; });
            if (!msgs.length) {
                container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">
                    <i class="fa-regular fa-comments" style="font-size:36px;opacity:0.3;display:block;margin-bottom:12px;"></i>
                    <div style="font-size:13px;">${isAR?'كن أول من يبدأ المحادثة':'Be the first to start the conversation'}</div>
                </div>`;
                return;
            }
            const isAdmin = window._isAdmin === true;
            const currentUid = window._userData?.uid || '';
            let html = '';
            msgs.forEach(m => {
                const isMe = isAdmin ? (m.senderType === 'admin') : (m.senderType === 'student' && m.uid === currentUid);
                html += buildCommunityBubble(m, isMe, isAR, groupId);
            });
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        }

        function buildReactionPills(m, groupId, isAR) {
            const reactions = m.reactions || {};
            const reactorId = window._communityReactorId ? window._communityReactorId() : '';
            const entries = COMMUNITY_REACTION_EMOJIS
                .map(e => [e, reactions[e] || []])
                .filter(([, arr]) => arr && arr.length);
            if (!entries.length) return '';
            return `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;">${entries.map(([e, arr]) => {
                const mine = arr.includes(reactorId);
                return `<span onclick="toggleCommunityReaction('${groupId}','${m.id}','${e}')" style="cursor:pointer;font-size:11px;padding:2px 7px;border-radius:99px;background:${mine?'rgba(var(--brand-rgb,30,122,52),0.25)':'rgba(255,255,255,0.06)'};border:1px solid ${mine?'var(--g3)':'var(--border)'};display:inline-flex;align-items:center;gap:3px;">${e}<span style="font-size:11px;color:var(--muted);">${arr.length}</span></span>`;
            }).join('')}</div>`;
        }

        function buildMsgActions(m, isMe, groupId, isAR) {
            const isAdmin = window._isAdmin === true;
            const canDelete = isMe || isAdmin;
            const replyCount = m.replyCount || 0;
            return `<div style="display:flex;align-items:center;gap:12px;margin-top:5px;">
                <span onclick="openMessageThread('${groupId}','${m.id}')" style="cursor:pointer;font-size:11px;color:var(--muted);display:inline-flex;align-items:center;gap:4px;" title="${isAR?'رد':'Reply'}">
                    <i class="fa-solid fa-reply"></i>${replyCount>0?` ${replyCount}`:''}
                </span>
                <span onclick="openCommunityReactionPicker(event,'${groupId}','${m.id}')" style="cursor:pointer;font-size:11px;color:var(--muted);" title="${isAR?'رياكت':'React'}">
                    <i class="fa-regular fa-face-smile"></i>
                </span>
                ${canDelete ? `<span onclick="deleteCommunityMsg('${groupId}','${m.id}')" style="cursor:pointer;font-size:11px;color:#ff6b6b;" title="${isAR?'حذف':'Delete'}">
                    <i class="fa-solid fa-trash"></i>
                </span>` : ''}
            </div>`;
        }

        function buildCommunityBubble(m, isMe, isAR, groupId) {
            const isLight = document.getElementById('pageBody').classList.contains('light-mode');
            const timeStr = m.createdAt?.toDate
                ? m.createdAt.toDate().toLocaleTimeString(isAR?'ar-EG':'en-US',{hour:'2-digit',minute:'2-digit'})
                : '';
            const myBubbleBg = 'linear-gradient(135deg,var(--g3),var(--g2))';
            const otherBg = isLight ? '#e8edf5' : '#2d3348';
            const otherColor = isLight ? '#0f2a40' : '#e8e6f0';
            const isAdminMsg = m.senderType === 'admin';
            const avatarLetter = isAdminMsg ? 'A' : (m.authorName||'?').trim().charAt(0).toUpperCase();
            const nameLabel = !isMe
                ? `<div style="font-size:11px;font-weight:700;color:${isAdminMsg?'var(--gold4)':'var(--g4)'};margin-bottom:3px;display:flex;align-items:center;gap:5px;">${escapeHtml(m.authorName||'Member')}${isAdminMsg?` <span style="font-size:9px;background:rgba(var(--brand-rgb,30,122,52),0.12);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);color:var(--green4);padding:1px 7px;border-radius:99px;"><i class="fa-solid fa-shield-check"></i> ${isAR?'الإدارة':'Admin'}</span>`:''}</div>`
                : '';
            const avatarBg = isAdminMsg ? 'linear-gradient(135deg,var(--gold3),var(--gold4))' : 'linear-gradient(135deg,var(--g2),var(--g4))';
            const reactionPills = buildReactionPills(m, groupId, isAR);
            const actionsRow = buildMsgActions(m, isMe, groupId, isAR);

            if (isMe) {
                return `<div style="display:flex;justify-content:${isAR?'flex-start':'flex-end'};margin-bottom:4px;">
                    <div style="max-width:72%;">
                        <div style="background:${myBubbleBg};color:#fff;padding:10px 14px;border-radius:${isAR?'16px 16px 4px 16px':'16px 16px 16px 4px'};font-size:14px;line-height:1.55;word-break:break-word;">${m.text}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:2px;text-align:${isAR?'left':'right'};">${timeStr}</div>
                        ${reactionPills}
                        <div style="display:flex;justify-content:${isAR?'flex-start':'flex-end'};">${actionsRow}</div>
                    </div>
                </div>`;
            } else {
                return `<div style="display:flex;justify-content:${isAR?'flex-end':'flex-start'};align-items:flex-end;gap:8px;margin-bottom:4px;">
                    <div style="width:30px;height:30px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0;">${avatarLetter}</div>
                    <div style="max-width:72%;">
                        ${nameLabel}
                        <div style="background:${otherBg};color:${otherColor};padding:10px 14px;border-radius:${isAR?'16px 16px 16px 4px':'16px 16px 4px 16px'};font-size:14px;line-height:1.55;word-break:break-word;border:1px solid var(--border);">${m.text}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${timeStr}</div>
                        ${reactionPills}
                        ${actionsRow}
                    </div>
                </div>`;
            }
        }

        /* ── Reaction picker popup (max 5 emojis) ── */
        window.openCommunityReactionPicker = function(event, groupId, messageId) {
            event.stopPropagation();
            document.getElementById('communityReactionPopup')?.remove();
            const btn = event.currentTarget;
            const rect = btn.getBoundingClientRect();
            const popup = document.createElement('div');
            popup.id = 'communityReactionPopup';
            popup.style.cssText = `position:fixed;top:${Math.max(8, rect.top - 48)}px;left:${Math.max(8, rect.left - 90)}px;z-index:99999;background:var(--bg2);border:1px solid var(--border2);border-radius:99px;padding:7px 12px;display:flex;gap:9px;box-shadow:0 10px 28px rgba(0,0,0,0.45);`;
            popup.innerHTML = COMMUNITY_REACTION_EMOJIS.map(e =>
                `<span onclick="toggleCommunityReaction('${groupId}','${messageId}','${e}')" style="cursor:pointer;font-size:19px;line-height:1;transition:transform 0.15s;display:inline-block;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">${e}</span>`
            ).join('');
            document.body.appendChild(popup);
            setTimeout(() => {
                document.addEventListener('click', function closeIt(ev) {
                    if (!popup.contains(ev.target)) { popup.remove(); document.removeEventListener('click', closeIt); }
                });
            }, 10);
        };

        window.toggleCommunityReaction = async function(groupId, messageId, emoji) {
            document.getElementById('communityReactionPopup')?.remove();
            try { await window._toggleMessageReaction(groupId, messageId, emoji); } catch(e) {}
        };

        /* ── Delete a message ── */
        window.deleteCommunityMsg = async function(groupId, messageId) {
            const isAR = lang === 'AR';
            if (!confirm(isAR ? 'هل تريد حذف هذه الرسالة؟' : 'Delete this message?')) return;
            try {
                await window._deleteCommunityMessage(groupId, messageId);
            } catch(e) {
                showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
            }
        };

        /* ── Reply thread panel: opens beside the group chat, replies never show inline in the group ── */
        let _threadUnsubscribe = null;
        window.openMessageThread = function(groupId, messageId) {
            const isAR = lang === 'AR';
            const originalMsg = (window._communityMsgCache?.[groupId] || {})[messageId] || {};
            document.getElementById('communityThreadOverlay')?.remove();
            if (typeof _threadUnsubscribe === 'function') { _threadUnsubscribe(); _threadUnsubscribe = null; }

            const isLight = document.getElementById('pageBody').classList.contains('light-mode');
            const overlay = document.createElement('div');
            overlay.id = 'communityThreadOverlay';
            overlay.style.cssText = `position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);display:flex;justify-content:${isAR?'flex-start':'flex-end'};`;
            overlay.innerHTML = `
            <div style="width:100%;max-width:380px;height:100%;background:var(--bg2);border-${isAR?'right':'left'}:1px solid var(--border2);display:flex;flex-direction:column;box-shadow:${isAR?'8px':'-8px'} 0 40px rgba(0,0,0,0.5);animation:${isAR?'communityThreadSlideInRtl':'communityThreadSlideIn'} 0.25s ease both;">
                <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <button onclick="closeMessageThread()" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--muted);width:30px;height:30px;border-radius:8px;cursor:pointer;flex-shrink:0;"><i class="fa-solid fa-xmark"></i></button>
                    <div style="font-size:14px;font-weight:700;"><i class="fa-solid fa-reply" style="color:var(--green4);margin-${isAR?'left':'right'}:6px;"></i>${isAR?'الردود':'Thread'}</div>
                </div>
                <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.02);flex-shrink:0;">
                    <div style="font-size:11px;font-weight:700;color:var(--gold4);margin-bottom:4px;">${escapeHtml(originalMsg.authorName||'')}</div>
                    <div style="font-size:13px;color:var(--text);line-height:1.6;word-break:break-word;">${originalMsg.text||''}</div>
                </div>
                <div id="communityThreadReplies" style="flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">
                    <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
                <div style="padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0;">
                    <div style="display:flex;gap:8px;align-items:flex-end;">
                        <input id="communityThreadInput" type="text" placeholder="${isAR?'اكتب رد...':'Write a reply...'}"
                            style="flex:1;padding:10px 14px;background:${isLight?'#f4f6fa':'rgba(0,0,0,0.3)'};border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:13px;font-family:'Tajawal',sans-serif;outline:none;"
                            onkeydown="if(event.key==='Enter'){sendCommunityThreadReply('${groupId}','${messageId}')}">
                        <button onclick="sendCommunityThreadReply('${groupId}','${messageId}')" style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--g3),var(--g2));border:none;cursor:pointer;flex-shrink:0;">
                            <i class="fa-solid fa-paper-plane" style="color:#fff;font-size:14px;transform:${isAR?'scaleX(-1)':'none'};"></i>
                        </button>
                    </div>
                </div>
            </div>`;
            overlay.addEventListener('click', e => { if (e.target === overlay) closeMessageThread(); });
            document.body.appendChild(overlay);

            _threadUnsubscribe = window._loadThreadRepliesRealtime(groupId, messageId, (replies) => {
                renderCommunityThreadReplies(replies, isAR);
            });
        };

        window.closeMessageThread = function() {
            if (typeof _threadUnsubscribe === 'function') { _threadUnsubscribe(); _threadUnsubscribe = null; }
            document.getElementById('communityThreadOverlay')?.remove();
        };

        function renderCommunityThreadReplies(replies, isAR) {
            const el = document.getElementById('communityThreadReplies');
            if (!el) return;
            if (!replies.length) {
                el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:12px;">${isAR?'لا توجد ردود بعد':'No replies yet'}</div>`;
                return;
            }
            const isAdmin = window._isAdmin === true;
            const currentUid = window._userData?.uid || '';
            const isLight = document.getElementById('pageBody').classList.contains('light-mode');
            const otherBg = isLight ? '#e8edf5' : '#2d3348';
            const otherColor = isLight ? '#0f2a40' : '#e8e6f0';
            el.innerHTML = replies.map(r => {
                const isMe = isAdmin ? (r.senderType === 'admin') : (r.senderType === 'student' && r.uid === currentUid);
                const isAdminMsg = r.senderType === 'admin';
                const timeStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleTimeString(isAR?'ar-EG':'en-US',{hour:'2-digit',minute:'2-digit'}) : '';
                return `<div style="display:flex;flex-direction:column;align-items:${isMe ? (isAR?'flex-start':'flex-end') : (isAR?'flex-end':'flex-start')};">
                    <div style="font-size:11px;font-weight:700;color:${isAdminMsg?'var(--gold4)':'var(--g4)'};margin-bottom:2px;">${escapeHtml(r.authorName||'')}</div>
                    <div style="max-width:85%;background:${isMe?'linear-gradient(135deg,var(--g3),var(--g2))':otherBg};color:${isMe?'#fff':otherColor};padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;word-break:break-word;border:${isMe?'none':'1px solid var(--border)'};">${escapeHtml(r.text||'')}</div>
                    <div style="font-size:9px;color:var(--muted);margin-top:2px;">${timeStr}</div>
                </div>`;
            }).join('');
            el.scrollTop = el.scrollHeight;
        }

        window.sendCommunityThreadReply = async function(groupId, messageId) {
            const input = document.getElementById('communityThreadInput');
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;
            const isAR = lang === 'AR';
            try {
                await window._sendThreadReply(groupId, messageId, escapeHtml(text));
                input.value = '';
            } catch(e) {
                showToast(isAR?'خطأ في الإرسال':'Send failed', true);
            }
        };

        window.communityRich = function(cmd, val) {
            document.getElementById('communityChatInput')?.focus();
            document.execCommand(cmd, false, val || null);
        };

        window.sendCommunityMsg = async function(groupId) {
            const input = document.getElementById('communityChatInput');
            if (!input) return;
            const html = input.innerHTML.trim();
            const text = input.innerText.trim();
            if (!text) return;
            const isAR = lang === 'AR';
            try {
                await window._sendCommunityMessage(groupId, html);
                input.innerHTML = '';
            } catch(e) {
                showToast(isAR?'خطأ في الإرسال':'Send failed', true);
            }
        };

        /* ── Show Group Members Popup ── */
        window.showGroupMembers = async function(groupId) {
            const isAR = lang === 'AR';
            // Remove existing popup if any
            document.getElementById('groupMembersOverlay')?.remove();

            const overlay = document.createElement('div');
            overlay.id = 'groupMembersOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;';
            overlay.innerHTML = `
            <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:20px;width:100%;max-width:400px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.8);overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                    <div style="font-size:15px;font-weight:700;"><i class="fa-solid fa-users" style="color:var(--green4);margin-${isAR?'left':'right'}:8px;"></i>${isAR?'أعضاء الجروب':'Group Members'}</div>
                    <button onclick="document.getElementById('groupMembersOverlay').remove()" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--muted);width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;">✕</button>
                </div>
                <div id="groupMembersList" style="flex:1;overflow-y:auto;padding:12px 16px;">
                    <div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;"></i></div>
                </div>
            </div>`;
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            document.body.appendChild(overlay);

            try {
                const members = await window._loadCommunityMembers(groupId);
                const listEl = document.getElementById('groupMembersList');
                if (!listEl) return;
                if (!members.length) {
                    listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px;">${isAR?'لا يوجد أعضاء بعد':'No members yet'}</div>`;
                    return;
                }
                listEl.innerHTML = members.map((m, i) => {
                    const name = m.name || (isAR ? 'عضو' : 'Member');
                    const letter = name.trim().charAt(0).toUpperCase();
                    const avatarBg = m.isAdmin
                        ? 'linear-gradient(135deg,var(--gold3),var(--gold4))'
                        : 'linear-gradient(135deg,var(--g2),var(--g4))';
                    const adminBadge = m.isAdmin
                        ? `<span style="font-size:9px;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.35);color:var(--gold4);padding:1px 7px;border-radius:99px;margin-${isAR?'right':'left'}:6px;"><i class="fa-solid fa-shield-check"></i> ${isAR?'الإدارة':'Admin'}</span>`
                        : '';
                    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px solid var(--border);${i===members.length-1?'border:none':''}">
                        <div style="width:36px;height:36px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;flex-shrink:0;">${letter}</div>
                        <div style="min-width:0;">
                            <div style="font-size:13px;font-weight:700;display:flex;align-items:center;flex-wrap:wrap;">${escapeHtml(name)}${adminBadge}</div>
                            ${m.email ? `<div style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.email)}</div>` : ''}
                        </div>
                    </div>`;
                }).join('');
            } catch(e) {
                const listEl = document.getElementById('groupMembersList');
                if (listEl) listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
            }
        };

        /* placeholder for community chat contenteditable */
        document.addEventListener('focusout', e => {
            if (e.target.id === 'communityChatInput' && !e.target.textContent.trim()) {
                e.target.innerHTML = '';
            }
        });

        /* ─── ADMIN: MANAGE COMMUNITY GROUPS ─── */
        async function loadCommunityAdminList(isAR) {
            const list = document.getElementById('communityAdminList');
            if (!list) return;
            try {
                const groups = await window._loadCommunityGroups();
                if (!groups.length) {
                    list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-folder-open" style="font-size:22px;"></i><p style="margin-top:8px;font-size:13px;">${isAR?'لا توجد جروبات بعد':'No groups yet'}</p></div>`;
                    return;
                }
                list.innerHTML = groups.map(g => `
                    <div class="community-admin-item">
                        <div class="community-admin-item-head">
                            <h4><i class="fa-solid ${communityGroupTypeIcon(g.type)}" style="color:var(--green4);margin-${isAR?'left':'right'}:6px;"></i>${escapeHtml(g.name||'')}</h4>
                            <div class="community-admin-item-actions">
                                <button class="btn-edit-community" onclick='editCommunityGroup(${JSON.stringify(g).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                                <button class="btn-delete-community" onclick="deleteCommunityGroup('${g.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
                            </div>
                        </div>
                        <span class="community-badge-type" style="width:fit-content;">${communityGroupTypeLabel(g.type, isAR)}</span>
                        ${g.description ? `<p style="font-size:12px;color:var(--muted);line-height:1.6;">${escapeHtml(g.description)}</p>` : ''}
                        <div style="font-size:12px;color:var(--muted);"><i class="fa-solid fa-user-group"></i> ${g.memberCount||0} ${isAR?'عضو':'members'}</div>
                        <button class="btn-post-job" style="margin-top:6px;" onclick="openCommunityChat('${g.id}')">
                            <i class="fa-solid fa-comments"></i> ${isAR?'دخول الجروب':'Enter Group'}
                        </button>
                    </div>
                `).join('');
            } catch(e) {
                list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
            }
        }

        window.saveCommunityGroup = async function() {
            const isAR = lang === 'AR';
            const editId = document.getElementById('cgEditId').value || null;
            const name = document.getElementById('cgName').value.trim();
            if (!name) {
                showToast(isAR ? 'برجاء إدخال اسم الجروب' : 'Please enter the group name', true);
                return;
            }
            const data = {
                name,
                description: document.getElementById('cgDesc').value.trim(),
                type: document.getElementById('cgType').value,
                conditions: document.getElementById('cgConditions').value.trim(),
                rules: document.getElementById('cgRules').value.trim(),
            };

            const btn = document.getElementById('btnSaveCommunity');
            btn.disabled = true;
            try {
                await window._saveCommunityGroup(editId, data);
                showToast(editId ? (isAR?'تم تحديث الجروب':'Group updated') : (isAR?'تم إضافة الجروب':'Group added'));
                cancelEditCommunity();
                loadCommunityAdminList(isAR);
            } catch(e) {
                showToast(isAR ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again', true);
            } finally {
                btn.disabled = false;
            }
        };

        window.editCommunityGroup = function(g) {
            const isAR = lang === 'AR';
            document.getElementById('cgEditId').value = g.id;
            document.getElementById('cgName').value = g.name || '';
            document.getElementById('cgDesc').value = g.description || '';
            document.getElementById('cgType').value = g.type || 'general';
            document.getElementById('cgConditions').value = g.conditions || '';
            document.getElementById('cgRules').value = g.rules || '';
            document.getElementById('communityFormTitle').innerHTML = `<i class="fa-solid fa-pen" style="color:var(--gold4);"></i> ${isAR?'تعديل الجروب':'Edit Group'}`;
            document.getElementById('btnSaveCommunityTxt').textContent = isAR?'تحديث الجروب':'Update Group';
            document.getElementById('btnCancelEditCommunity').style.display = '';
            document.getElementById('cgName').scrollIntoView({behavior:'smooth', block:'center'});
        };

        window.cancelEditCommunity = function() {
            const isAR = lang === 'AR';
            document.getElementById('cgEditId').value = '';
            document.getElementById('cgName').value = '';
            document.getElementById('cgDesc').value = '';
            document.getElementById('cgType').selectedIndex = 0;
            document.getElementById('cgConditions').value = '';
            document.getElementById('cgRules').value = '';
            document.getElementById('communityFormTitle').innerHTML = `<i class="fa-solid fa-circle-plus" style="color:var(--green4);"></i> ${isAR?'إضافة جروب جديد':'Add New Group'}`;
            document.getElementById('btnSaveCommunityTxt').textContent = isAR?'حفظ الجروب':'Save Group';
            document.getElementById('btnCancelEditCommunity').style.display = 'none';
        };

        window.deleteCommunityGroup = async function(groupId) {
            const isAR = lang === 'AR';
            if (!confirm(isAR ? 'هل أنت متأكد من حذف هذا الجروب؟' : 'Are you sure you want to delete this group?')) return;
            try {
                await window._deleteCommunityGroup(groupId);
                showToast(isAR?'تم حذف الجروب':'Group deleted');
                loadCommunityAdminList(isAR);
            } catch(e) {
                showToast(isAR ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again', true);
            }
        };


        /* ─── ADMIN: MEMBERS LIST (standalone page) ─── */
        function renderAdminMembers(area) {
            area = area || document.getElementById('contentArea');
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'قائمة الأعضاء' : 'Members List'}</h2>
                <p>${isAR ? 'إدارة جميع أعضاء المنصة' : 'Manage all platform members'}</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                    <i class="fa-solid fa-list" style="color:var(--g3);"></i>
                    ${isAR ? 'جميع الأعضاء' : 'All Members'}
                    <span id="memberCountBadge" style="background:var(--g3);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
                </h4>
                <button onclick="adminLoadMembers()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(212,160,23,0.22)'" onmouseout="this.style.background='rgba(212,160,23,0.1)'">
                    <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
                </button>
            </div>
            <div id="membersList" style="display:flex;flex-direction:column;gap:8px;">
                <div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>`;
            setTimeout(() => adminLoadMembers(), 100);
        }

        /* ─── ADMIN: PRO UPGRADE REQUESTS (standalone page) ─── */
        function renderAdminProRequests(area) {
            area = area || document.getElementById('contentArea');
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'طلبات الترقية إلى Pro' : 'Pro Upgrade Requests'}</h2>
                <p>${isAR ? 'مراجعة وتفعيل طلبات الترقية الواردة من الطلاب' : 'Review and activate incoming upgrade requests'}</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                    <i class="fa-solid fa-arrow-up" style="color:var(--gold3);"></i>
                    ${isAR ? 'طلبات الترقية' : 'Upgrade Requests'}
                    <span id="upgradeReqBadge" style="background:var(--gold3);color:#000;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;display:none;"></span>
                </h4>
                <button onclick="adminLoadMembers()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(212,160,23,0.22)'" onmouseout="this.style.background='rgba(212,160,23,0.1)'">
                    <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
                </button>
            </div>
            <div id="upgradeRequestsList" style="display:flex;flex-direction:column;gap:10px;">
                <div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>`;
            setTimeout(() => adminLoadMembers(), 100);
        }

        /* ─── ADMIN: STUDENT MAPS MANAGEMENT ─── */
        async function renderAdminPortfolio(area) {
            area = area || document.getElementById('contentArea');
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'إدارة خرائط الطلبة' : 'Manage Student Maps'}</h2>
                <p>${isAR ? 'استعرض وأدر المشاريع المنشورة من الطلاب' : 'View and manage maps published by students'}</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                    <i class="fa-solid fa-map-location-dot" style="color:var(--g3);"></i>
                    ${isAR ? 'الخرائط المنشورة' : 'Published Maps'}
                    <span id="adminMapsCountBadge" style="background:var(--g3);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
                </h4>
                <button onclick="adminLoadPortfolioItems()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:10px;color:var(--g4);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(var(--brand-rgb,30,122,52),0.22)'" onmouseout="this.style.background='rgba(var(--brand-rgb,30,122,52),0.1)'">
                    <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
                </button>
            </div>
            <div id="adminMapsList" style="display:flex;flex-direction:column;gap:10px;">
                <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>`;
            setTimeout(() => adminLoadPortfolioItems(), 100);
        }

        window.adminLoadPortfolioItems = async function() {
            const isAR = lang === 'AR';
            const list = document.getElementById('adminMapsList');
            const badge = document.getElementById('adminMapsCountBadge');
            if (!list) return;
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
            try {
                const items = await window._loadPortfolioItems();
                if (badge) badge.textContent = items.length;
                if (!items.length) {
                    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-map" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد خرائط منشورة بعد':'No published maps yet'}</div>`;
                    return;
                }
                list.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;">
                    ${items.map(it => {
                        const isImg = it.fileData && /^data:image\//.test(it.fileData);
                        const thumb = isImg
                            ? `<div style="width:52px;height:52px;border-radius:8px;background-image:url('${it.fileData}');background-size:cover;background-position:center;flex-shrink:0;cursor:pointer;" onclick="openPortfolioLightbox('${it.id}')"></div>`
                            : `<div style="width:52px;height:52px;border-radius:8px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🗺️</div>`;
                        const timeStr = it.createdAt?.toDate ? it.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
                        return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;transition:0.2s;">
                            ${thumb}
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:700;color:var(--text);">${it.title||'—'}</div>
                                <div style="font-size:11px;color:var(--gold3);font-weight:700;margin-top:2px;">${it.authorName||''}</div>
                                ${it.desc ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${it.desc}</div>` : ''}
                                ${timeStr ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;"><i class="fa-regular fa-clock"></i> ${timeStr}</div>` : ''}
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
                                ${isImg ? `<button onclick="openPortfolioLightbox('${it.id}')" style="display:flex;align-items:center;gap:4px;padding:7px 12px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:8px;color:var(--green4);font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;" title="${isAR?'عرض':'View'}"><i class="fa-solid fa-expand"></i></button>` : ''}
                                <button onclick="adminDeletePortfolioItem('${it.id}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(220,50,50,0.22)'" onmouseout="this.style.background='rgba(220,50,50,0.08)'" title="${isAR?'حذف':'Delete'}">
                                    <i class="fa-solid fa-trash" style="font-size:13px;"></i>
                                </button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
            } catch(e) {
                list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
            }
        };

        window.adminDeletePortfolioItem = async function(itemId) {
            const isAR = lang === 'AR';
            if (!confirm(isAR ? 'حذف هذه الخريطة نهائياً؟' : 'Delete this map permanently?')) return;
            try {
                await window._deletePortfolioItem(itemId);
                showToast(isAR ? '🗑️ تم حذف الخريطة' : '🗑️ Map deleted');
                // Remove from cache too
                _portfolioItemsCache = _portfolioItemsCache.filter(x => x.id !== itemId);
                adminLoadPortfolioItems();
            } catch(e) {
                showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
            }
        };

        /* ─── ADMIN: MENTORSHIP REQUESTS ─── */
        async function renderAdminMentorship(area) {
            area = area || document.getElementById('contentArea');
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'إدارة الاستشارات' : 'Consultation Management'}</h2>
                <p>${isAR ? 'شوف طلبات الطلاب ورد عليهم بمواعيد التوفر ولينك الجلسة' : 'View student requests and reply with available times and a session link'}</p>
            </div>

            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                    <i class="fa-solid fa-comments" style="color:var(--gold3);"></i>
                    ${isAR ? 'طلبات الاستشارة' : 'Consultation Requests'}
                    <span id="adminRequestsCountBadge" style="background:var(--gold3);color:#000;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
                </h4>
                <button onclick="adminLoadMentorshipRequests()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(212,160,23,0.22)'" onmouseout="this.style.background='rgba(212,160,23,0.1)'">
                    <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
                </button>
            </div>
            <div id="adminRequestsList" style="display:flex;flex-direction:column;gap:12px;">
                <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>`;

            setTimeout(() => adminLoadMentorshipRequests(), 100);
        }

        window.adminLoadMentorshipRequests = async function() {
            const isAR = lang === 'AR';
            const list = document.getElementById('adminRequestsList');
            const badge = document.getElementById('adminRequestsCountBadge');
            if (!list) return;
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
            try {
                const reqs = await window._loadMentorshipRequests();
                if (badge) { badge.textContent = reqs.length; badge.style.display = reqs.length ? 'inline-flex' : 'none'; }
                if (!reqs.length) {
                    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-comments" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد طلبات بعد':'No requests yet'}</div>`;
                    return;
                }
                list.innerHTML = reqs.map(r => {
                    const timeStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                    const waLink = r.phone ? `https://wa.me/${r.phone.replace(/\D/g,'')}` : null;
                    const mailLink = r.email ? `mailto:${r.email}` : null;
                    return `<div id="request_${r.id}" style="padding:16px 18px;background:rgba(212,160,23,0.04);border:1px solid rgba(212,160,23,0.18);border-radius:14px;">
                        <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--gold2),var(--gold3));display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:16px;flex-shrink:0;">${(r.authorName||'U')[0].toUpperCase()}</div>
                            <div style="flex:1;min-width:200px;">
                                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                    <div style="font-size:14px;font-weight:700;color:var(--text);">${r.authorName||'—'}</div>
                                    <span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;background:${r.replied ? 'rgba(var(--brand-rgb,30,122,52),0.15)' : 'rgba(212,160,23,0.15)'};color:${r.replied ? 'var(--green4)' : 'var(--gold3)'};">${r.replied ? (isAR?'تم الرد':'Replied') : (isAR?'قيد الانتظار':'Pending')}</span>
                                </div>
                                <div style="font-size:12px;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                    ${mailLink ? `<a href="${mailLink}" style="color:var(--gold3);font-weight:700;text-decoration:none;font-size:12px;"><i class="fa-solid fa-envelope"></i> ${r.email}</a>` : ''}
                                    ${r.phone ? `<span style="color:var(--muted);font-size:11px;">· ${r.phone}</span>` : ''}
                                </div>
                                <div style="font-size:13px;color:var(--text);line-height:1.75;margin-top:9px;white-space:pre-wrap;">${(r.message||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                                ${(r.preferredDay || r.preferredTime) ? `<div style="font-size:11px;font-weight:700;color:var(--gold3);margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><i class="fa-regular fa-calendar-check"></i> ${isAR ? 'الوقت المطلوب:' : 'Requested time:'} ${r.preferredDay || ''} ${r.preferredTime ? '— ' + r.preferredTime : ''}</div>` : ''}
                                ${timeStr ? `<div style="font-size:11px;color:var(--muted);margin-top:7px;"><i class="fa-regular fa-clock"></i> ${timeStr}</div>` : ''}
                                ${r.replied ? `<div style="margin-top:11px;padding:10px 12px;background:rgba(var(--brand-rgb,30,122,52),0.07);border:1px solid rgba(var(--brand-rgb,30,122,52),0.22);border-radius:10px;">
                                    <div style="font-size:11px;font-weight:700;color:var(--green4);margin-bottom:4px;">${isAR?'ردك':'Your Reply'}</div>
                                    <div style="font-size:12px;color:var(--text);line-height:1.65;white-space:pre-wrap;">${(r.reply||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                                </div>` : `
                                <div id="replyBox_${r.id}" style="margin-top:11px;">
                                    <textarea id="replyInput_${r.id}" rows="3" placeholder="${isAR?'اكتب ردك هنا (لينك الجلسة والمواعيد المتاحة)...':'Write your reply here (session link and available times)...'}" style="width:100%;padding:10px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(212,160,23,0.25);border-radius:10px;color:var(--text);font-size:13px;font-family:'Tajawal',sans-serif;outline:none;resize:vertical;margin-bottom:8px;"></textarea>
                                    <button onclick="adminSendMentorshipReply('${r.id}')" style="padding:9px 18px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:9px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                        <i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال الرد':'Send Reply'}
                                    </button>
                                </div>`}
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
                                ${waLink ? `<a href="${waLink}" target="_blank" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(37,211,102,0.12);border:1px solid rgba(37,211,102,0.3);border-radius:8px;color:#25d366;" title="${isAR?'واتساب':'WhatsApp'}"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                                <button onclick="adminDeleteMentorshipRequest('${r.id}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(220,50,50,0.22)'" onmouseout="this.style.background='rgba(220,50,50,0.08)'" title="${isAR?'حذف':'Delete'}">
                                    <i class="fa-solid fa-trash" style="font-size:13px;"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            } catch(e) {
                list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
            }
        };

        window.adminSendMentorshipReply = async function(requestId) {
            const isAR = lang === 'AR';
            const input = document.getElementById('replyInput_' + requestId);
            const text = input?.value.trim();
            if (!text) {
                showToast(isAR ? 'من فضلك اكتب الرد الأول' : 'Please write a reply first', true);
                return;
            }
            try {
                await window._replyMentorshipRequest(requestId, text);
                showToast(isAR ? '✓ تم إرسال الرد للطالب' : '✓ Reply sent to the student');
                adminLoadMentorshipRequests();
            } catch(e) {
                showToast(isAR ? 'خطأ في الإرسال، حاول مرة ثانية' : 'Failed to send, please try again', true);
            }
        };

        window.adminDeleteMentorshipRequest = async function(requestId) {
            const isAR = lang === 'AR';
            if (!confirm(isAR ? 'حذف هذا الطلب نهائياً؟' : 'Delete this request permanently?')) return;
            try {
                await window._deleteMentorshipRequest(requestId);
                showToast(isAR ? '🗑️ تم حذف الطلب' : '🗑️ Request deleted');
                const el = document.getElementById('request_' + requestId);
                if (el) { el.style.opacity='0'; el.style.transition='0.3s'; setTimeout(()=>el.remove(),300); }
            } catch(e) {
                showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
            }
        };

        function renderAccount(area) {
            area = area || document.getElementById('contentArea');
            const isAR = lang === 'AR';

            // ── ADMIN account view ──
            if (window._isAdmin && window._adminProfile) {
                const adm = window._adminProfile;
                const img = window._base64Img || '';
                const letter = adm.firstName[0].toUpperCase();
                const avatarInlineStyle = img
                    ? `style="cursor:pointer;background-image:url('${img}');background-size:cover;background-position:center;"`
                    : `style="cursor:pointer;"`;
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR ? 'حساب الإدارة' : 'Admin Account'}</h2>
                    <p>${isAR ? 'بيانات حساب المشرف' : 'Your admin profile and settings'}</p>
                </div>
                <div class="account-grid">
                    <div class="profile-card">
                        <div class="avatar-xl" id="avatarXl" ${avatarInlineStyle} onclick="document.getElementById('adminImgInput').click()">
                            ${!img ? `<span>${letter}</span>` : ''}
                            <div class="avatar-xl-overlay"><i class="fa-solid fa-camera"></i></div>
                        </div>
                        <input type="file" id="adminImgInput" accept="image/*" style="display:none;" onchange="handleAdminImageUpload(event)">
                        <div class="profile-name">${adm.displayName}</div>
                        <div class="profile-email" style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                            <i class="fa-solid fa-shield-halved" style="color:var(--gold3);font-size:12px;"></i>
                            <span style="color:var(--gold3);font-weight:700;font-size:13px;">${window._adminIsSuper ? (isAR ? 'مشرف النظام' : 'System Admin') : (isAR ? 'عضو عادي' : 'Team Member')}</span>
                        </div>
                    </div>
                    <div class="form-card">
                        <h3>${isAR ? 'معلومات الحساب' : 'Account Info'}</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>${isAR ? 'الاسم الأول' : 'First Name'}</label>
                                <input type="text" value="${adm.firstName}" disabled style="opacity:0.7;">
                            </div>
                            <div class="form-group">
                                <label>${isAR ? 'الاسم الأخير' : 'Last Name'}</label>
                                <input type="text" value="${adm.lastName}" disabled style="opacity:0.7;">
                            </div>
                            <div class="form-group">
                                <label>${isAR ? 'اسم المستخدم' : 'Username'}</label>
                                <input type="text" value="${adm.username}" disabled style="opacity:0.7;">
                            </div>
                            <div class="form-group">
                                <label>${isAR ? 'الصلاحية' : 'Role'}</label>
                                <input type="text" value="${window._adminIsSuper ? (isAR ? 'مشرف النظام' : 'System Administrator') : (isAR ? 'عضو عادي' : 'Team Member')}" disabled style="opacity:0.7;color:var(--gold3);">
                            </div>
                            ${!window._adminIsSuper ? `
                            <div class="form-group">
                                <label>${isAR ? 'تابع لـ' : 'Belongs To'}</label>
                                <input type="text" value="${adm.org === 'terrascope' ? 'TerraScope' : 'GIS Explorer'}" disabled style="opacity:0.7;">
                            </div>` : ''}
                        </div>
                        <div style="margin-top:20px;padding:14px 16px;background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.2);border-radius:10px;font-size:13px;color:var(--muted);">
                            <i class="fa-solid fa-circle-info" style="color:var(--gold3);margin-left:6px;"></i>
                            ${isAR ? 'يمكنك تغيير صورتك بالضغط على الأفاتار أعلاه.' : 'You can update your profile photo by clicking the avatar above.'}
                        </div>
                    </div>
                </div>
                ${window._adminIsSuper ? `
                <div class="form-card" style="margin-top:24px;">
                    <h3>${isAR ? 'إدارة فريق العمل' : 'Team Management'}</h3>
                    <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px;">${isAR ? 'أنشئ حسابات لزملائك في الإدارة وحدد الأقسام المسموح لهم بالدخول إليها.' : 'Create accounts for your teammates and choose which admin sections they can access.'}</p>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>${isAR?'الاسم الأول':'First Name'}</label>
                            <input type="text" id="teamFirstName" placeholder="${isAR?'الاسم الأول':'First name'}">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'الاسم الأخير':'Last Name'}</label>
                            <input type="text" id="teamLastName" placeholder="${isAR?'الاسم الأخير':'Last name'}">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'اسم المستخدم':'Username'}</label>
                            <input type="text" id="teamUsername" placeholder="${isAR?'اسم المستخدم':'Username'}">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'كلمة المرور':'Password'}</label>
                            <input type="text" id="teamPassword" placeholder="${isAR?'كلمة المرور':'Password'}">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'تابع لـ':'Belongs To'}</label>
                            <select id="teamOrg">
                                <option value="gis_explorer">GIS Explorer</option>
                                <option value="terrascope">TerraScope</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-top:14px;">
                        <label style="display:block;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">${isAR?'الأقسام المسموح بالدخول إليها':'Accessible Sections'}</label>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;">
                            ${ADMIN_PERMISSION_LIST.map(p => `
                            <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer;font-size:13px;">
                                <input type="checkbox" class="teamPermCheck" value="${p.key}">
                                <i class="fa-solid ${p.icon}" style="color:var(--gold3);width:16px;text-align:center;"></i>
                                ${isAR ? p.labelAR : p.labelEN}
                            </label>`).join('')}
                        </div>
                    </div>

                    <div class="btn-row" style="margin-top:16px;">
                        <button class="btn-save" id="teamCreateBtn" onclick="submitNewTeamMember()">
                            <i class="fa-solid fa-user-plus"></i>
                            <span>${isAR?'إنشاء الحساب':'Create Account'}</span>
                        </button>
                    </div>

                    <div style="border-top:1px solid var(--border);margin-top:24px;padding-top:20px;">
                        <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">${isAR?'أعضاء الفريق الحاليين':'Current Team Members'}</h4>
                        <div id="teamMembersList" style="display:flex;flex-direction:column;gap:10px;">
                            <div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
                        </div>
                    </div>
                </div>` : ''}`;
                if (window._adminIsSuper) setTimeout(() => adminLoadTeamAccounts(), 100);
                return;
            }

            const d = window._userData || {};
            const plan = d.plan || 'basic';
            const isPro = plan === 'pro';
            const letter = d.firstName ? d.firstName[0].toUpperCase() : 'U';
            const img = window._base64Img || '';
            const avatarStyle = img ? `style="background-image:url('${img}')"` : '';
            const levelOpts = ['Level 1','Level 2','Level 3','Level 4','Graduate'];
            const levelLabels = isAR
                ? ['المستوى 1','المستوى 2','المستوى 3','المستوى 4','خريج']
                : levelOpts;
            const tab = window._accountTab || 'hub';
            const backBtn = `<button class="settings-back-btn" onclick="goSettings('hub')">
                <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i>
                ${isAR?'العودة للإعدادات':'Back to Settings'}
            </button>`;

            /* ── HUB: choose a settings section ── */
            if (tab === 'hub') {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'الإعدادات':'Settings'}</h2>
                    <p>${isAR?'إدارة بياناتك وحسابك وتفضيلاتك':'Manage your profile, account, and preferences'}</p>
                </div>
                <div class="form-card">
                    <div class="settings-hub-item" onclick="goSettings('profile')">
                        <div class="settings-hub-icon"><i class="fa-solid fa-id-card"></i></div>
                        <div class="settings-hub-text">
                            <div class="settings-hub-title">${isAR?'بياناتي الشخصية':'Personal Information'}</div>
                            <div class="settings-hub-desc">${isAR?'الاسم، الصورة، البيانات الأكاديمية':'Name, photo, and academic details'}</div>
                        </div>
                        <i class="fa-solid fa-${isAR?'angle-left':'angle-right'} settings-hub-arrow"></i>
                    </div>
                    <div class="settings-hub-item" onclick="goSettings('password')">
                        <div class="settings-hub-icon"><i class="fa-solid fa-key"></i></div>
                        <div class="settings-hub-text">
                            <div class="settings-hub-title">${isAR?'تغيير كلمة المرور':'Change Password'}</div>
                            <div class="settings-hub-desc">${isAR?'تحديث كلمة مرور حسابك':'Update your account password'}</div>
                        </div>
                        <i class="fa-solid fa-${isAR?'angle-left':'angle-right'} settings-hub-arrow"></i>
                    </div>
                    <div class="settings-hub-item" onclick="goSettings('language')">
                        <div class="settings-hub-icon"><i class="fa-solid fa-language"></i></div>
                        <div class="settings-hub-text">
                            <div class="settings-hub-title">${isAR?'اللغة':'Language'}</div>
                            <div class="settings-hub-desc">${isAR?'العربية / English':'Arabic / English'}</div>
                        </div>
                        <i class="fa-solid fa-${isAR?'angle-left':'angle-right'} settings-hub-arrow"></i>
                    </div>
                    <div class="settings-hub-item" onclick="goSettings('plan')">
                        <div class="settings-hub-icon"><i class="fa-solid fa-crown"></i></div>
                        <div class="settings-hub-text">
                            <div class="settings-hub-title">${isAR?'خطة الاشتراك':'Subscription Plan'}</div>
                            <div class="settings-hub-desc">${isPro ? (isAR?'أنت عضو Pro':'You are on Pro') : (isAR?'خطتك الحالية: Basic':'Current plan: Basic')}</div>
                        </div>
                        <i class="fa-solid fa-${isAR?'angle-left':'angle-right'} settings-hub-arrow"></i>
                    </div>
                    <div class="settings-hub-item" onclick="goSettings('wallet')">
                        <div class="settings-hub-icon"><i class="fa-solid fa-coins"></i></div>
                        <div class="settings-hub-text">
                            <div class="settings-hub-title">${isAR?'🪙 محفظة العملات':'🪙 Coin Wallet'}</div>
                            <div class="settings-hub-desc">${isAR?`رصيدك الحالي: ${d.coins||0} عملة — استبدلها بشهور PRO`:`Your balance: ${d.coins||0} coins — redeem for PRO months`}</div>
                        </div>
                        <i class="fa-solid fa-${isAR?'angle-left':'angle-right'} settings-hub-arrow"></i>
                    </div>
                    <div class="settings-hub-item" onclick="goSettings('invite')">
                        <div class="settings-hub-icon"><i class="fa-solid fa-user-plus"></i></div>
                        <div class="settings-hub-text">
                            <div class="settings-hub-title">${isAR?'دعوة الأصدقاء':'Invite Friends'}</div>
                            <div class="settings-hub-desc">${isAR?`اكسب عملات مقابل كل صديق ينضم (${d.referralCoinsEarned||0} عملة حتى الآن)`:`Earn coins for every friend who joins (${d.referralCoinsEarned||0} so far)`}</div>
                        </div>
                        <i class="fa-solid fa-${isAR?'angle-left':'angle-right'} settings-hub-arrow"></i>
                    </div>
                </div>`;
                return;
            }

            /* ── PERSONAL INFORMATION ── */
            if (tab === 'profile') {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'بياناتي الشخصية':'Personal Information'}</h2>
                    <p>${isAR?'إدارة بياناتك ومعلومات الحساب':'Manage your personal info and account settings'}</p>
                </div>
                ${backBtn}
                <div class="account-grid">
                    <div class="profile-card">
                        <div class="avatar-xl" id="avatarXl" ${avatarStyle} onclick="document.getElementById('imageInput').click()">
                            ${!img ? `<span>${letter}</span>` : ''}
                            <div class="avatar-xl-overlay"><i class="fa-solid fa-camera"></i></div>
                        </div>
                        <div class="profile-name" id="profileDisplayName">${(d.firstName||'')+' '+(d.lastName||'')}</div>
                        <div class="profile-email">${d.email||''}</div>
                    </div>
                    <div class="form-card">
                        <h3>${isAR?'تعديل البيانات':'Edit Profile'}</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>${isAR?'الاسم الأول':'First Name'}</label>
                                <input type="text" id="pFirstName" value="${d.firstName||''}" placeholder="${isAR?'الاسم الأول':'First name'}">
                            </div>
                            <div class="form-group">
                                <label>${isAR?'الاسم الأخير':'Last Name'}</label>
                                <input type="text" id="pLastName" value="${d.lastName||''}" placeholder="${isAR?'الاسم الأخير':'Last name'}">
                            </div>
                            <div class="form-group">
                                <label>${isAR?'رقم الهاتف':'Phone'}</label>
                                <input type="tel" id="pPhone" value="${d.phone||''}" placeholder="+201xxxxxxxxx">
                            </div>
                            <div class="form-group">
                                <label>${isAR?'البريد الإلكتروني':'Email'}</label>
                                <input type="email" id="pEmail" value="${d.email||''}" disabled>
                            </div>
                            <div class="form-group">
                                <label>${isAR?'المسمى الوظيفي':'Job Title'}</label>
                                <input type="text" id="pJob" value="${d.job||''}" placeholder="${isAR?'مثال: طالب':'e.g. Student'}">
                            </div>
                            <div class="form-group">
                                <label>${isAR?'الجامعة / الجهة':'University / Company'}</label>
                                <input type="text" id="pCompany" value="${d.company||''}" placeholder="${isAR?'اسم الجامعة':'University or Company'}">
                            </div>
                            <div class="form-group">
                                <label>${isAR?'المستوى الأكاديمي':'Academic Level'}</label>
                                <select id="pLevel">
                                    ${levelOpts.map((v,i)=>`<option value="${v}" ${(d.academicLevel||'')=== v?'selected':''}>${levelLabels[i]}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>${isAR?'النبذة الشخصية':'Profile Bio'}</label>
                                <textarea id="pBio" placeholder="${isAR?'نبذة عن خبراتك في GIS...':'Tell us about your GIS expertise...'}">${d.bio||''}</textarea>
                            </div>
                        </div>

                        <div class="btn-row" style="margin-top:24px;">
                            <button class="btn-save" id="saveProfileBtn" onclick="saveProfile()">
                                <i class="fa-solid fa-floppy-disk"></i>
                                <span>${isAR?'حفظ التغييرات':'Save Changes'}</span>
                            </button>
                            <button class="btn-danger" onclick="deleteAccount()">
                                <i class="fa-solid fa-trash-can"></i>
                                <span>${isAR?'حذف الحساب':'Delete Account'}</span>
                            </button>
                        </div>
                    </div>
                </div>`;
                return;
            }

            /* ── CHANGE PASSWORD ── */
            if (tab === 'password') {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'تغيير كلمة المرور':'Change Password'}</h2>
                    <p>${isAR?'حافظ على حسابك آمناً بكلمة مرور قوية':'Keep your account secure with a strong password'}</p>
                </div>
                ${backBtn}
                <div class="form-card">
                    <h3><i class="fa-solid fa-lock" style="color:var(--g3);margin-left:8px;"></i>${isAR?'تغيير كلمة المرور':'Change Password'}</h3>
                    <div class="form-grid">
                        <div class="form-group" style="grid-column:1/-1;">
                            <label>${isAR?'كلمة المرور الحالية':'Current Password'}</label>
                            <div style="position:relative;">
                                <input type="password" id="pCurrentPass" placeholder="${isAR?'أدخل كلمة المرور الحالية':'Enter current password'}" style="padding-right:42px;width:100%;">
                                <button type="button" onclick="toggleEyeField('pCurrentPass',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;transition:color 0.2s;"><i class="fa-regular fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${isAR?'كلمة المرور الجديدة':'New Password'}</label>
                            <div style="position:relative;">
                                <input type="password" id="pNewPass" placeholder="${isAR?'كلمة المرور الجديدة':'New password'}" style="padding-right:42px;width:100%;" oninput="checkAccountPassStrength()">
                                <button type="button" onclick="toggleEyeField('pNewPass',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;transition:color 0.2s;"><i class="fa-regular fa-eye"></i></button>
                            </div>
                            <div class="pass-strength-bar" style="margin-top:6px;"><div class="pass-strength-fill" id="acctPassFill"></div></div>
                            <div class="pass-strength-label" id="acctPassLabel"></div>
                        </div>
                        <div class="form-group">
                            <label>${isAR?'تأكيد كلمة المرور الجديدة':'Confirm New Password'}</label>
                            <div style="position:relative;">
                                <input type="password" id="pConfirmPass" placeholder="${isAR?'أعد كتابة كلمة المرور الجديدة':'Confirm new password'}" style="padding-right:42px;width:100%;">
                                <button type="button" onclick="toggleEyeField('pConfirmPass',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;transition:color 0.2s;"><i class="fa-regular fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                    <button class="btn-save" style="margin-top:12px;width:auto;padding:10px 24px;" onclick="changePassword()">
                        <i class="fa-solid fa-key"></i>
                        <span>${isAR?'تغيير كلمة المرور':'Change Password'}</span>
                    </button>
                </div>`;
                return;
            }

            /* ── LANGUAGE ── */
            if (tab === 'language') {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'اللغة':'Language'}</h2>
                    <p>${isAR?'اختر لغة عرض المنصة':'Choose the platform display language'}</p>
                </div>
                ${backBtn}
                <div class="form-card">
                    <h3>${isAR?'لغة المنصة':'Platform Language'}</h3>
                    <div class="lang-option-row">
                        <div class="lang-option-card${lang==='AR'?' active':''}" onclick="selectSettingsLang('AR')">
                            <div class="lang-option-flag">🇪🇬</div>
                            <div class="lang-option-name">العربية</div>
                            ${lang==='AR' ? `<div class="lang-option-check"><i class="fa-solid fa-circle-check"></i> ${isAR?'مفعّلة':'Active'}</div>` : ''}
                        </div>
                        <div class="lang-option-card${lang==='EN'?' active':''}" onclick="selectSettingsLang('EN')">
                            <div class="lang-option-flag">🇬🇧</div>
                            <div class="lang-option-name">English</div>
                            ${lang==='EN' ? `<div class="lang-option-check"><i class="fa-solid fa-circle-check"></i> ${isAR?'مفعّلة':'Active'}</div>` : ''}
                        </div>
                    </div>
                </div>`;
                return;
            }

            /* ── SUBSCRIPTION PLAN (ATLASYA PRO checkout flow) ── */
            if (tab === 'plan') {
                // Fresh entry into the Plan page always starts the flow state machine at 'entry'
                window._subState = { step: 'entry', method: null };
                window._subScreenshotData = '';

                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'خطة الاشتراك':'Subscription Plan'}</h2>
                    <p>${isAR?'إدارة خطتك ومميزاتك':'Manage your plan and features'}</p>
                </div>
                ${backBtn}
                <div id="planTabRoot" style="margin-top:0;">
                    <div style="text-align:center;padding:50px 20px;color:var(--muted);"><div class="spinner" style="margin:0 auto;"></div></div>
                </div>`;
                if (typeof window._renderPlanTabRoot === 'function') window._renderPlanTabRoot();
                return;
            }

            /* ── COIN WALLET (earn/redeem ATLAS Coins) ── */
            if (tab === 'wallet') {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'🪙 محفظة العملات':'🪙 Coin Wallet'}</h2>
                    <p>${isAR?'اجمع العملات من التحديات والدعوات، واستبدلها بشهور من ATLASYA PRO':'Earn coins from challenges and invites, and redeem them for ATLASYA PRO months'}</p>
                </div>
                ${backBtn}
                <div id="walletRoot" style="margin-top:16px;">
                    <div style="text-align:center;padding:50px 20px;color:var(--muted);"><div class="spinner" style="margin:0 auto;"></div></div>
                </div>`;
                renderWalletRoot();
                return;
            }

            /* ── INVITE FRIENDS (referral link) ── */
            if (tab === 'invite') {
                const refLink = PLATFORM_BASE_URL + '?ref=' + (window._currentUid || '') + '#/dashboard';
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'دعوة الأصدقاء':'Invite Friends'}</h2>
                    <p>${isAR?'شارك رابطك واكسب عملات مع كل صديق ينضم':'Share your link and earn coins for every friend who joins'}</p>
                </div>
                ${backBtn}
                <div class="form-card" style="margin-top:16px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:19px;color:#0a0a0e;flex-shrink:0;">
                            <i class="fa-solid fa-coins"></i>
                        </div>
                        <div>
                            <div style="font-size:14px;font-weight:700;">${isAR?`اكسب 30 عملة عن كل صديق`:`Earn 30 coins per friend`}</div>
                            <div style="font-size:12px;color:var(--muted);">${isAR?'يشترك صديقك عن طريق رابطك وتحصل أنت على المكافأة فوراً':'Your friend joins through your link and you get the reward instantly'}</div>
                        </div>
                    </div>

                    <label style="display:block;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${isAR?'رابط الدعوة الخاص بك':'Your invite link'}</label>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <input type="text" readonly id="referralLinkInput" value="${refLink}" style="flex:1;min-width:200px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:11px 14px;color:var(--text);font-size:12.5px;direction:ltr;text-align:left;">
                        <button onclick="copyReferralLink()" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            <i class="fa-solid fa-copy"></i> ${isAR?'نسخ':'Copy'}
                        </button>
                        <button onclick="shareReferralLink()" style="display:flex;align-items:center;gap:6px;padding:10px 18px;background:linear-gradient(135deg,var(--gold3),var(--gold2));border:none;border-radius:10px;color:#0a0a0e;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            <i class="fa-solid fa-share-nodes"></i> ${isAR?'مشاركة':'Share'}
                        </button>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
                    <div class="report-stat-card">
                        <div class="rs-icon"><i class="fa-solid fa-user-group"></i></div>
                        <div class="rs-val">${d.referralCount||0}</div>
                        <div class="rs-label">${isAR?'عدد الدعوات الناجحة':'Friends invited'}</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="rs-icon"><i class="fa-solid fa-coins"></i></div>
                        <div class="rs-val">${d.referralCoinsEarned||0}</div>
                        <div class="rs-label">${isAR?'عملات الدعوات':'Coins from invites'}</div>
                    </div>
                </div>`;
                return;
            }
        }