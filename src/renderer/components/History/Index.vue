<template>
  <el-container class="main panel" direction="vertical">
    <el-header class="panel-header history-header" height="auto">
      <h4>{{ $t('history.title') }}</h4>
      <div class="history-filters">
        <el-input
          class="history-search"
          size="mini"
          clearable
          :placeholder="$t('history.search-placeholder')"
          v-model="query"
          @input="onFilterChange"
        />
        <el-select class="history-select" size="mini" v-model="category" @change="onFilterChange">
          <el-option value="" :label="$t('history.all-categories')" />
          <el-option
            v-for="key in categories"
            :key="key"
            :value="key"
            :label="$t(`history.category-${key}`)"
          />
        </el-select>
        <el-select class="history-select" size="mini" v-model="status" @change="onFilterChange">
          <el-option value="" :label="$t('history.all-status')" />
          <el-option value="complete" :label="$t('history.status-complete')" />
          <el-option value="error" :label="$t('history.status-error')" />
        </el-select>
      </div>
    </el-header>
    <el-main class="panel-content history-content">
      <el-empty v-if="!loading && items.length === 0" :description="$t('history.no-history')" />
      <ul class="history-list" v-else>
        <li class="history-item" v-for="item in items" :key="item.id">
          <i class="history-item-icon">
            <mo-icon :name="iconForCategory(item.category)" width="20" height="20" />
          </i>
          <div class="history-item-main">
            <div class="history-item-name" :title="item.name">{{ item.name }}</div>
            <div class="history-item-meta">
              <span :class="['history-status', `history-status-${item.status}`]">
                {{ $t(`history.status-${item.status}`) }}
              </span>
              <span>{{ item.totalLength | bytesToSize }}</span>
              <span>{{ item.finishedAt | localeDateTimeFormat(locale) }}</span>
            </div>
          </div>
          <div class="history-item-actions">
            <i @click="onOpenFolder(item)">
              <mo-icon name="folder" width="14" height="14" />
            </i>
            <i v-if="item.uri" @click="onRedownload(item)">
              <mo-icon name="task-restart" width="14" height="14" />
            </i>
            <i @click="onRemove(item)">
              <mo-icon name="trash" width="14" height="14" />
            </i>
          </div>
        </li>
      </ul>
      <div class="history-load-more" v-if="hasMore">
        <el-button size="mini" :loading="loading" @click="loadMore">
          {{ $t('history.load-more') }}
        </el-button>
      </div>
    </el-main>
  </el-container>
</template>

<script>
  import { debounce } from 'lodash'
  import { mapGetters } from 'vuex'

  import { bytesToSize, localeDateTimeFormat } from '@shared/utils'
  import { history as historyApi } from '@/utils/electron'
  import { showItemInFolder } from '@/utils/native'
  import '@/components/Icons/folder'
  import '@/components/Icons/task-restart'
  import '@/components/Icons/trash'
  import '@/components/Icons/video'
  import '@/components/Icons/audio'
  import '@/components/Icons/document'
  import '@/components/Icons/inbox'

  const PAGE_SIZE = 100
  const CATEGORIES = ['videos', 'audio', 'documents', 'archives', 'applications', 'other']
  const CATEGORY_ICONS = {
    videos: 'video',
    audio: 'audio',
    documents: 'document',
    archives: 'inbox',
    applications: 'inbox',
    other: 'inbox'
  }

  export default {
    name: 'mo-history',
    filters: {
      bytesToSize,
      localeDateTimeFormat
    },
    data () {
      return {
        query: '',
        category: '',
        status: '',
        items: [],
        total: 0,
        loading: false,
        categories: CATEGORIES
      }
    },
    computed: {
      ...mapGetters('preference', ['locale']),
      hasMore () {
        return this.items.length < this.total
      }
    },
    created () {
      this.onFilterChange = debounce(this.reload, 300)
      this.reload()
    },
    methods: {
      iconForCategory (category) {
        return CATEGORY_ICONS[category] || 'inbox'
      },
      async fetchPage (offset) {
        this.loading = true
        try {
          const { items, total } = await historyApi.list({
            query: this.query,
            category: this.category,
            status: this.status,
            offset,
            limit: PAGE_SIZE
          })
          this.total = total
          return items
        } finally {
          this.loading = false
        }
      },
      async reload () {
        this.items = await this.fetchPage(0)
      },
      async loadMore () {
        const more = await this.fetchPage(this.items.length)
        this.items = [...this.items, ...more]
      },
      async onOpenFolder (item) {
        await showItemInFolder(item.path, {
          errorMsg: this.$t('history.file-not-exist')
        })
      },
      onRedownload (item) {
        this.$store.dispatch('app/updateAddTaskUrl', item.uri)
        this.$store.dispatch('app/showAddTaskDialog', 'uri')
      },
      async onRemove (item) {
        await historyApi.remove([item.id])
        this.items = this.items.filter((entry) => entry.id !== item.id)
        this.total = Math.max(0, this.total - 1)
      }
    }
  }
</script>

<style lang="scss">
.history-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-bottom: 16px !important;
  h4 {
    margin-bottom: 12px;
  }
}
.history-filters {
  display: flex;
  gap: 8px;
  width: 100%;
}
.history-search {
  flex: 1;
}
.history-select {
  width: 140px;
}
.history-content {
  padding: 0 16px;
}
.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.history-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid $--panel-border-color;
}
.history-item-icon {
  flex: 0 0 auto;
  margin-right: 12px;
  svg {
    color: $--color-text-secondary;
  }
}
.history-item-main {
  flex: 1;
  min-width: 0;
}
.history-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-item-meta {
  font-size: 12px;
  color: $--color-text-secondary;
  > span {
    margin-right: 12px;
  }
}
.history-status-error {
  color: $--color-danger;
}
.history-item-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
  margin-left: 12px;
  i {
    cursor: pointer;
    color: $--color-text-secondary;
    &:hover {
      color: $--color-text-primary;
    }
  }
}
.history-load-more {
  text-align: center;
  padding: 16px 0;
}
</style>
