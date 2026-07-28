"""
Custom ArcFace Model Architecture with ResNet Backbone (PyTorch).
Uses Transfer Learning initialization for high face feature discriminability.
"""
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

class ArcMarginProduct(nn.Module):
    """ArcFace Margin Loss Module."""
    def __init__(self, in_features=512, out_features=1000, s=30.0, m=0.50):
        super(ArcMarginProduct, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.s = s
        self.m = m
        self.weight = nn.Parameter(torch.FloatTensor(out_features, in_features))
        nn.init.xavier_uniform_(self.weight)

        self.cos_m = math.cos(m)
        self.sin_m = math.sin(m)
        self.th = math.cos(math.pi - m)
        self.mm = math.sin(math.pi - m) * m

    def forward(self, input_features, label):
        cosine = F.linear(F.normalize(input_features), F.normalize(self.weight))
        sine = torch.sqrt(torch.clamp(1.0 - torch.pow(cosine, 2), min=1e-7))
        
        phi = cosine * self.cos_m - sine * self.sin_m
        phi = torch.where(cosine > self.th, phi, cosine - self.mm)
        
        one_hot = torch.zeros(cosine.size(), device=input_features.device)
        one_hot.scatter_(1, label.view(-1, 1).long(), 1)
        
        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output *= self.s
        return output

class CustomArcFaceNet(nn.Module):
    """ResNet-18 Transfer Learning Backbone producing 512D L2-normalized Face Embedding."""
    def __init__(self, embedding_size=512):
        super().__init__()
        # Use torchvision ResNet18 pretrained backbone
        resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        
        self.fc = nn.Sequential(
            nn.Linear(512, embedding_size),
            nn.BatchNorm1d(embedding_size)
        )

    def forward(self, x):
        features = self.backbone(x)
        features = torch.flatten(features, 1)
        embeddings = self.fc(features)
        return F.normalize(embeddings, p=2, dim=1)
