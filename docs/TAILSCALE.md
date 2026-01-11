# Tailscale Setup Guide for MathCyber

Bu döküman, MathCyber uygulamasını Tailscale private network üzerinden çalıştırmak için gerekli adımları açıklar.

## Tailscale Nedir?

Tailscale, cihazlarınız arasında güvenli, özel bir ağ oluşturmanızı sağlayan modern bir VPN çözümüdür. Zero-config VPN olarak da bilinir ve WireGuard protokolünü kullanır.

## Ön Gereksinimler

- Docker ve Docker Compose yüklü olmalı
- Tailscale hesabı (https://tailscale.com/)
- Tailscale Auth Key

## Kurulum Adımları

### 1. Tailscale Auth Key Alma

1. [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys) sayfasına gidin
2. "Generate auth key" butonuna tıklayın
3. Ayarlar:
   - **Reusable**: İsterseniz işaretleyin (aynı key'i birden fazla cihaz için kullanabilirsiniz)
   - **Ephemeral**: Geçici bağlantılar için (container yeniden başlatıldığında otomatik silinir)
   - **Tags**: `tag:mathcyber` etiketi ekleyin (opsiyonel ama önerilir)
4. Key'i kopyalayın (tskey-auth-... ile başlar)

### 2. Environment Variables Ayarlama

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve Tailscale auth key'inizi ekleyin:

```env
TAILSCALE_AUTH_KEY=tskey-auth-YOUR-ACTUAL-KEY-HERE
TAILSCALE_HOSTNAME=mathcyber-app
TAILSCALE_EXTRA_ARGS=--advertise-tags=tag:mathcyber
```

### 3. Docker Container'ları Başlatma

```bash
# Build ve start
docker-compose up -d --build

# Logları görüntüleme
docker-compose logs -f

# Sadece Tailscale loglarını görme
docker-compose logs -f tailscale
```

### 4. Tailscale Durumunu Kontrol Etme

```bash
# Tailscale container'a bağlan
docker exec -it mathcyber-tailscale sh

# Tailscale durumunu kontrol et
tailscale status

# IP adresini öğren
tailscale ip
```

## Kullanım

Uygulama başarıyla başlatıldıktan sonra:

1. **Tailscale Network Üzerinden Erişim**:
   - Tailscale status komutundan aldığınız IP ile erişin
   - Örnek: `http://100.x.x.x:9002`

2. **Lokal Erişim** (same host):
   - `http://localhost:9002`

3. **Tailscale Hostname ile Erişim**:
   - `http://mathcyber-app:9002` (Tailscale MagicDNS aktifse)

## Faydalı Komutlar

```bash
# Container'ları durdurma
docker-compose down

# Container'ları silme (volumes dahil)
docker-compose down -v

# Yeniden build etme
docker-compose up -d --build --force-recreate

# Logları temizleme
docker-compose logs --tail=100 -f

# Tailscale bağlantısını kontrol etme
docker exec mathcyber-tailscale tailscale status

# Uygulamanın sağlık durumunu kontrol etme
curl http://localhost:9002
```

## Güvenlik Notları

1. **Auth Key Güvenliği**:
   - `.env` dosyasını asla git'e commit etmeyin
   - Auth key'leri düzenli olarak rotate edin
   - Ephemeral key'ler kullanarak güvenliği artırın

2. **Network İzolasyonu**:
   - Tailscale, uygulamanızı sadece Tailscale network üzerindeki cihazlara açar
   - Public internet'ten doğrudan erişim olmaz

3. **ACL (Access Control Lists)**:
   - Tailscale admin console'dan ACL kuralları tanımlayarak erişimi sınırlayın
   - Tag-based access control kullanın

## Sorun Giderme

### Tailscale Bağlanamıyor

```bash
# Container loglarını kontrol et
docker-compose logs tailscale

# Auth key'in geçerli olduğundan emin ol
# Tailscale admin console'dan key'in expire olmadığını kontrol et
```

### Uygulama Erişilemiyor

```bash
# Uygulama loglarını kontrol et
docker-compose logs app

# Port'un dinlendiğini kontrol et
docker exec mathcyber-app netstat -tlnp | grep 9002

# Network bağlantısını test et
docker exec mathcyber-tailscale ping app
```

### Network Mode Hatası

Eğer `network_mode: service:tailscale` hata veriyorsa, docker-compose.yml'de `network_mode` satırını kaldırın ve uygulamayı normal network'te çalıştırın. Bu durumda Tailscale sadece sidecar olarak çalışır.

## Gelişmiş Yapılandırma

### Subnet Routing

Eğer tüm Docker network'ünü Tailscale üzerinden expose etmek istiyorsanız:

```yaml
# docker-compose.yml içinde tailscale service'e ekleyin
environment:
  - TS_EXTRA_ARGS=--advertise-routes=172.16.0.0/16
```

### Exit Node

MathCyber'ı Tailscale exit node olarak kullanmak için:

```yaml
environment:
  - TS_EXTRA_ARGS=--advertise-exit-node
```

## Referanslar

- [Tailscale Documentation](https://tailscale.com/kb/)
- [Tailscale Docker Guide](https://tailscale.com/kb/1282/docker/)
- [Tailscale ACLs](https://tailscale.com/kb/1018/acls/)
