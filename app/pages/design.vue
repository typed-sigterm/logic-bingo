<template>
  <UEmpty
    class="w-100 m-auto"
    title="Work In Progress"
    description="等待社区贡献中……"
    icon="lucide:flask-conical"
    size="xl"
    :actions="[{
      label: '参与贡献',
      icon: 'lucide:git-pull-request-arrow',
      href: 'https://github.com/typed-sigterm/logic-bingo',
      target: '_blank',
      variant: 'outline',
      color: 'neutral',
      size: 'md',
    }]"
  />
</template>
