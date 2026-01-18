// Popup script
document.getElementById('openKindle').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://read.amazon.com/notebook' });
  window.close();
});
